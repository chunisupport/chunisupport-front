import { NumberField } from '@kobalte/core/number-field'
import { A } from '@solidjs/router'
import { ArrowDown, ArrowUp, Minus, ScanSearch, SearchX } from 'lucide-solid'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  type JSX,
  Show,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { fetchChartScores } from '../../api/chartScores'
import { fetchRatingBands } from '../../api/ratingBands'
import { LoadError, Loading } from '../../components'
import { AppSelect } from '../../components/common/AppSelect'
import { type AppTabOption, SegmentedToggleGroup } from '../../components/common/AppTabs'
import { CheckboxField } from '../../components/common/CheckboxField'
import { createWindowVirtualTable } from '../../components/common/createWindowVirtualTable'
import { RecordDifficultyBadge } from '../../components/common/record/RecordBadges'
import {
  COMPACT_VIRTUAL_TABLE_CELL_CLASS,
  COMPACT_VIRTUAL_TABLE_HEADER_CLASS,
  COMPACT_VIRTUAL_TABLE_ROW_HEIGHT,
} from '../../components/common/virtualTableStyles'
import { SCORE_THEORETICAL_MAX, WEAK_CHART_INSPECTOR_DIFFICULTIES } from '../../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import { buildSongDetailPath, UNIFIED_WEAK_CHART_INSPECTOR_PATH } from '../../constants/routes'
import { getToolLink } from '../../constants/tools'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import type { PlayerDataDifficulty } from '../../types/api'
import { fetchUserRatingWithCache } from '../../usecases/cache/fetchUserRatingWithCache'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import { formatChartConst } from '../../utils/chartConstFormat'
import { formatInteger } from '../../utils/numberFormat'
import { clampNumericInput } from '../../utils/numberInput'
import { ALL_RATING_BAND_LABEL, resolveInitialBestSlotRatingBand } from '../../utils/ratingBand'
import { formatScoreDifference, getScoreDifferenceClass } from '../../utils/scoreDifference'
import {
  inspectUnifiedWeakCharts,
  UNIFIED_WEAK_CHART_CATEGORIES,
  type UnifiedWeakChartCategory,
  type UnifiedWeakChartEntry,
} from '../../utils/unifiedWeakChartInspector'
import {
  UNIFIED_WEAK_CHART_COPY as COPY,
  UNIFIED_WEAK_CHART_CATEGORY_VIEW,
  UNIFIED_WEAK_CHART_INPUT_CLASS,
  UNIFIED_WEAK_CHART_TABLE_GRID,
  UNIFIED_WEAK_CHART_THRESHOLD,
} from './unifiedWeakChartInspector.constants'

type BandOption = { label: string; value: string }
type CategoryFilter = UnifiedWeakChartCategory | 'all'

/**
 * 自分のスコア分布での外れ値方向を矢印アイコンで表示する。
 * @param props - 外れ値方向。外れ値でない場合は null。
 * @returns 方向を示すアイコンとスクリーンリーダー向けの名称。
 */
const PersonalOutlierIcon = (props: {
  direction: UnifiedWeakChartEntry['personalOutlier']
}): JSX.Element => {
  const label = () =>
    props.direction === 'LOW' ? COPY.low : props.direction === 'HIGH' ? COPY.high : COPY.normal
  return (
    <span title={label()} class="inline-flex">
      <Show
        when={props.direction}
        fallback={<Minus class="h-4 w-4 text-text-subtle" aria-hidden="true" />}
      >
        {(direction) =>
          direction() === 'LOW' ? (
            <ArrowDown class="h-4 w-4 text-danger" aria-hidden="true" />
          ) : (
            <ArrowUp class="h-4 w-4 text-success" aria-hidden="true" />
          )
        }
      </Show>
      <span class="sr-only">{label()}</span>
    </span>
  )
}

/**
 * 判定をアイコン付きの色バッジで表示する。
 * @param props - 表示する判定。
 * @returns 判定の色、アイコン、表示名を持つバッジ。
 */
const CategoryBadge = (props: { category: UnifiedWeakChartCategory }): JSX.Element => {
  const view = () => UNIFIED_WEAK_CHART_CATEGORY_VIEW[props.category]
  return (
    <span class={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${view().class}`}>
      <Dynamic component={view().icon} class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {view().label}
    </span>
  )
}

/**
 * 判定と点差による優先順位を仮想化テーブルで表示する。
 * 曲名のみ左寄せ、その他の列は Online 版の比較表と同じく中央揃えにする。
 * @param props - 絞り込み済みの統合分析結果。
 * @returns 曲名リンク、難易度、定数、スコア、平均、点差、外れ値、判定の表。
 */
const UnifiedComparisonTable = (props: { entries: UnifiedWeakChartEntry[] }): JSX.Element => {
  const virtual = createWindowVirtualTable<HTMLElement, HTMLTableSectionElement>({
    rowCount: () => props.entries.length,
    rowHeight: COMPACT_VIRTUAL_TABLE_ROW_HEIGHT,
    resetOnRowCountChange: true,
    layoutDeps: () => props.entries,
  })
  createEffect((previous?: UnifiedWeakChartEntry[]) => {
    const current = props.entries
    if (previous !== undefined && previous !== current) virtual.resetToTop()
    return current
  })
  const centeredHeaders = [
    COPY.difficulty,
    COPY.constant,
    COPY.score,
    COPY.average,
    COPY.difference,
    COPY.personal,
    COPY.category,
  ]
  return (
    <section
      ref={virtual.setTableContainerRef}
      class="overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-surface"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: 横スクロール領域をキーボードでも操作できるようにする。
      tabIndex={0}
      aria-label={COPY.results}
    >
      <table class="block w-full min-w-[44rem] text-sm" aria-rowcount={props.entries.length + 1}>
        <caption class="sr-only">{COPY.results}</caption>
        <thead class="block min-w-full">
          <tr class="grid" style={{ 'grid-template-columns': UNIFIED_WEAK_CHART_TABLE_GRID }}>
            <th
              scope="col"
              class={`${COMPACT_VIRTUAL_TABLE_HEADER_CLASS} justify-start px-3 text-left`}
            >
              {COPY.title}
            </th>
            <For each={centeredHeaders}>
              {(header) => (
                <th
                  scope="col"
                  class={`${COMPACT_VIRTUAL_TABLE_HEADER_CLASS} justify-center px-0 text-center`}
                >
                  {header}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody
          ref={virtual.setTableBodyRef}
          class="relative block min-w-full"
          style={{ height: `${virtual.getTotalSize()}px` }}
        >
          <For each={virtual.virtualRows()}>
            {(row) => {
              const entry = createMemo(() => props.entries[row.index])
              return (
                <Show when={entry()} keyed>
                  {(item) => (
                    <tr
                      class="absolute left-0 top-0 grid min-w-full border-t border-border hover:bg-surface-muted"
                      style={{
                        'grid-template-columns': UNIFIED_WEAK_CHART_TABLE_GRID,
                        transform: `translateY(${row.start - virtual.scrollMargin()}px)`,
                      }}
                      aria-rowindex={row.index + 2}
                    >
                      <th
                        scope="row"
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} min-w-0 p-0 text-left font-medium`}
                      >
                        <A
                          href={buildSongDetailPath(item.record.id, item.record.difficulty)}
                          title={item.record.title}
                          class="flex h-full w-full min-w-0 items-center px-3 font-sans text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
                        >
                          <span class="truncate">{item.record.title}</span>
                        </A>
                      </th>
                      <td
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center`}
                      >
                        <RecordDifficultyBadge difficulty={item.record.difficulty} />
                      </td>
                      <td
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center font-jost tabular-nums`}
                      >
                        {formatChartConst(item.record.const)}
                      </td>
                      <td
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center font-jost tabular-nums`}
                      >
                        {formatInteger(item.record.score)}
                      </td>
                      <td
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center font-jost tabular-nums`}
                      >
                        {item.averageScore === null
                          ? COPY.missing
                          : formatInteger(Math.trunc(item.averageScore))}
                      </td>
                      <td
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center font-jost tabular-nums ${item.difference === null ? 'text-text-subtle' : getScoreDifferenceClass(item.difference)}`}
                      >
                        {item.difference === null
                          ? COPY.missing
                          : formatScoreDifference(item.difference)}
                      </td>
                      <td
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center`}
                      >
                        <PersonalOutlierIcon direction={item.personalOutlier} />
                      </td>
                      <td
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center`}
                      >
                        <CategoryBadge category={item.category} />
                      </td>
                    </tr>
                  )}
                </Show>
              )
            }}
          </For>
        </tbody>
      </table>
    </section>
  )
}

/**
 * 判定フィルターの選択肢として、アイコン・表示名・件数を並べる。
 * @param props - 判定（すべての場合は省略）、表示名、件数。
 * @returns 判定色のアイコンと件数を含むラベル。
 */
const CategoryCount = (props: {
  category?: UnifiedWeakChartCategory
  label: string
  count: number
}): JSX.Element => (
  <>
    <Show when={props.category}>
      {(category) => (
        <span
          class={`inline-flex rounded-full p-1 ${UNIFIED_WEAK_CHART_CATEGORY_VIEW[category()].class}`}
        >
          <Dynamic
            component={UNIFIED_WEAK_CHART_CATEGORY_VIEW[category()].icon}
            class="h-3.5 w-3.5"
            aria-hidden="true"
          />
        </span>
      )}
    </Show>
    {props.label}
    <span class="font-jost tabular-nums">{formatInteger(props.count)}</span>
  </>
)

/**
 * 結果がない状態をアイコンと短い語で表示する。
 * @param props - 表示する短い語。
 * @returns 中央寄せの空状態表示。
 */
const EmptyState = (props: { label: string }): JSX.Element => (
  <p class="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface py-10 text-text-muted">
    <SearchX class="h-8 w-8" aria-hidden="true" />
    {props.label}
  </p>
)

/**
 * 自分のスコア分布での外れ値と同レート帯の平均との差を統合する管理者向け画面。
 * @returns 比較帯・難易度・閾値・判定を選べる優先順位表。
 */
const UnifiedWeakChartInspectorPage = (): JSX.Element => {
  const tool = getToolLink(UNIFIED_WEAK_CHART_INSPECTOR_PATH)
  useDocumentTitle(tool.title)
  const username = () => authSession.user?.username ?? null
  const [bands] = createResource(fetchRatingBands)
  const [rating] = createResource(username, fetchUserRatingWithCache)
  const [records] = createResource(username, fetchUserRecordWithCache)
  const [difficulties, setDifficulties] = createSignal<PlayerDataDifficulty[]>([
    ...WEAK_CHART_INSPECTOR_DIFFICULTIES,
  ])
  const [snapshots] = createResource(difficulties, (selected) =>
    Promise.all(selected.map(fetchChartScores))
  )
  const [band, setBand] = createSignal<BandOption | null>(null)
  const [threshold, setThreshold] = createSignal(String(UNIFIED_WEAK_CHART_THRESHOLD))
  const [category, setCategory] = createSignal<CategoryFilter>('all')
  const bandOptions = createMemo(() =>
    (bands() ?? [])
      .filter((item) => item.label !== ALL_RATING_BAND_LABEL)
      .sort((a, b) => b.sort_order - a.sort_order)
      .map((item) => ({ label: item.label, value: item.label }))
  )
  createEffect(() => {
    if (band() || !bands() || rating.loading) return
    const initial = resolveInitialBestSlotRatingBand(bands() ?? [], rating()?.best_average)
    if (initial) setBand({ label: initial.label, value: initial.label })
  })
  const entries = createMemo(() =>
    inspectUnifiedWeakCharts(
      (records()?.standard ?? []).filter((record) => difficulties().includes(record.difficulty)),
      snapshots() ?? [],
      band()?.value ?? '',
      threshold() === '' ? UNIFIED_WEAK_CHART_THRESHOLD : Number(threshold())
    )
  )
  const filtered = createMemo(() =>
    entries().filter((entry) => category() === 'all' || entry.category === category())
  )
  const categoryOptions = createMemo((): AppTabOption<CategoryFilter>[] => [
    { value: 'all', label: <CategoryCount label={COPY.all} count={entries().length} /> },
    ...UNIFIED_WEAK_CHART_CATEGORIES.map((value) => ({
      value,
      label: (
        <CategoryCount
          category={value}
          label={UNIFIED_WEAK_CHART_CATEGORY_VIEW[value].label}
          count={entries().filter((entry) => entry.category === value).length}
        />
      ),
    })),
  ])
  const loading = () => bands.loading || rating.loading || records.loading || snapshots.loading
  const error = () => bands.error ?? rating.error ?? records.error ?? snapshots.error

  /**
   * 貼り付け時も閾値を非負整数の範囲内に保つ。
   * @param value - 入力された閾値。空欄は入力途中として保持する。
   * @returns なし。
   */
  const changeThreshold = (value: string): void => {
    if (/^\d*$/.test(value)) setThreshold(clampNumericInput(value, 0, SCORE_THEORETICAL_MAX))
  }
  return (
    <main class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <header class="flex items-center gap-3">
        <ScanSearch class="h-8 w-8 shrink-0 text-action-primary" aria-hidden="true" />
        <h1 class="text-2xl font-semibold">{tool.title}</h1>
      </header>
      <section class="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-surface p-4">
        <AppSelect<BandOption>
          options={bandOptions()}
          value={band()}
          onChange={(value) => value && setBand(value)}
          optionValue="value"
          optionTextValue="label"
          formatLabel={(value) => value.label}
          label={COPY.ratingBand}
          rootClass="w-full sm:w-48"
        />
        <NumberField
          value={threshold()}
          onChange={changeThreshold}
          minValue={0}
          maxValue={SCORE_THEORETICAL_MAX}
          step={1}
          format={false}
          allowedInput={/^\d*$/}
          class="w-full sm:w-40"
        >
          <NumberField.Label class="mb-1 block text-sm text-text-muted">
            {COPY.threshold}
          </NumberField.Label>
          <div class="relative">
            <span
              class="pointer-events-none absolute inset-y-0 left-3 flex items-center font-jost text-text-muted"
              aria-hidden="true"
            >
              −
            </span>
            <NumberField.Input class={`${UNIFIED_WEAK_CHART_INPUT_CLASS} pl-7 pr-8 text-right`} />
            <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-muted">
              {COPY.thresholdUnit}
            </span>
          </div>
        </NumberField>
        <fieldset class="w-full">
          <legend class="mb-2 text-sm text-text-muted">{COPY.difficulty}</legend>
          <div class="flex flex-wrap gap-x-6 gap-y-2">
            <For each={PLAYER_DATA_DIFFICULTIES}>
              {(difficulty) => (
                <CheckboxField
                  textVariant="large"
                  label={difficulty}
                  checked={difficulties().includes(difficulty)}
                  onChange={(checked) =>
                    setDifficulties((current) =>
                      checked
                        ? [...current, difficulty]
                        : current.filter((value) => value !== difficulty)
                    )
                  }
                />
              )}
            </For>
          </div>
        </fieldset>
      </section>
      <Show when={!loading()} fallback={<Loading />}>
        <Show when={!error()} fallback={<LoadError error={error()} />}>
          <Show when={band()} fallback={<EmptyState label={COPY.noBands} />}>
            <SegmentedToggleGroup
              options={categoryOptions()}
              value={category()}
              onChange={setCategory}
              ariaLabel={COPY.category}
              class="flex w-full flex-wrap"
              itemClass="min-h-10 flex-1 whitespace-nowrap"
            />
            <Show when={filtered().length > 0} fallback={<EmptyState label={COPY.empty} />}>
              <UnifiedComparisonTable entries={filtered()} />
            </Show>
          </Show>
        </Show>
      </Show>
    </main>
  )
}

export default UnifiedWeakChartInspectorPage
