import { NumberField } from '@kobalte/core/number-field'
import { A } from '@solidjs/router'
import { ScanSearch } from 'lucide-solid'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  type JSX,
  Show,
} from 'solid-js'
import { fetchChartScores } from '../../api/chartScores'
import { fetchRatingBands } from '../../api/ratingBands'
import { LoadError, Loading } from '../../components'
import { AppSelect } from '../../components/common/AppSelect'
import { CheckboxField } from '../../components/common/CheckboxField'
import { createWindowVirtualTable } from '../../components/common/createWindowVirtualTable'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
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
type CategoryOption = { label: string; value: UnifiedWeakChartCategory | 'all' }

/**
 * 分類と点差による優先順位を仮想化テーブルで表示する。
 * @param props - 絞り込み済みの統合分析結果。
 * @returns 曲名リンク、スコア、個人判定、帯比較、分類の表。
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
  const headers = [
    COPY.title,
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
      class="overflow-x-auto rounded-lg border border-border bg-surface"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: 横スクロール領域をキーボードでも操作できるようにする。
      tabIndex={0}
      aria-label={COPY.results}
    >
      <table class="w-full min-w-[53rem] text-sm" aria-rowcount={props.entries.length + 1}>
        <caption class="sr-only">{COPY.results}</caption>
        <thead class="block min-w-full">
          <tr class="grid" style={{ 'grid-template-columns': UNIFIED_WEAK_CHART_TABLE_GRID }}>
            <For each={headers}>
              {(header) => (
                <th scope="col" class={`${COMPACT_VIRTUAL_TABLE_HEADER_CLASS} px-3`}>
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
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} min-w-0 font-medium text-left`}
                      >
                        <A
                          href={buildSongDetailPath(item.record.id, item.record.difficulty)}
                          title={item.record.title}
                          class="flex h-full w-full min-w-0 items-center px-3 font-sans text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
                        >
                          <span class="truncate">{item.record.title}</span>
                        </A>
                      </th>
                      <td class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} px-2`}>
                        <DifficultyBadge difficulty={item.record.difficulty} />
                      </td>
                      <td class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} px-2 font-jost tabular-nums`}>
                        {formatChartConst(item.record.const)}
                      </td>
                      <td class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} px-2 font-jost tabular-nums`}>
                        {formatInteger(item.record.score)}
                      </td>
                      <td class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} px-2 font-jost tabular-nums`}>
                        {item.averageScore === null
                          ? COPY.missing
                          : formatInteger(Math.trunc(item.averageScore))}
                      </td>
                      <td
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} px-2 font-jost tabular-nums ${item.difference === null ? 'text-text-subtle' : getScoreDifferenceClass(item.difference)}`}
                      >
                        {item.difference === null
                          ? COPY.missing
                          : formatScoreDifference(item.difference)}
                      </td>
                      <td class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} px-2`}>
                        {item.personalOutlier === 'LOW'
                          ? COPY.low
                          : item.personalOutlier === 'HIGH'
                            ? COPY.high
                            : COPY.normal}
                      </td>
                      <td class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} px-2`}>
                        <span
                          title={UNIFIED_WEAK_CHART_CATEGORY_VIEW[item.category].hint}
                          class={`rounded px-2 py-1 text-xs ${UNIFIED_WEAK_CHART_CATEGORY_VIEW[item.category].class}`}
                        >
                          {UNIFIED_WEAK_CHART_CATEGORY_VIEW[item.category].label}
                        </span>
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
 * 個人内の外れ値とレート帯平均との差を統合する管理者向け画面。
 * @returns 比較帯・難易度・閾値・分類を選べる優先順位表。
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
  const categoryOptions: CategoryOption[] = [
    { label: COPY.all, value: 'all' },
    ...UNIFIED_WEAK_CHART_CATEGORIES.map((value) => ({
      value,
      label: UNIFIED_WEAK_CHART_CATEGORY_VIEW[value].label,
    })),
  ]
  const [category, setCategory] = createSignal<CategoryOption>(categoryOptions[0])
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
    entries().filter((entry) => category().value === 'all' || entry.category === category().value)
  )
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
          class="w-full sm:w-56"
        >
          <NumberField.Label class="mb-1 block text-sm text-text-muted" title={COPY.thresholdHint}>
            {COPY.threshold}
          </NumberField.Label>
          <NumberField.Input class={UNIFIED_WEAK_CHART_INPUT_CLASS} title={COPY.thresholdHint} />
        </NumberField>
        <AppSelect<CategoryOption>
          options={categoryOptions}
          value={category()}
          onChange={(value) => value && setCategory(value)}
          optionValue="value"
          optionTextValue="label"
          formatLabel={(value) => value.label}
          label={COPY.category}
          rootClass="w-full sm:w-48"
        />
        <fieldset class="w-full">
          <legend class="mb-2 text-sm text-text-muted">{COPY.difficulty}</legend>
          <div class="grid gap-2 sm:grid-cols-5">
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
          <Show when={band()} fallback={<p class="text-text-muted">{COPY.noBands}</p>}>
            <section class="flex flex-wrap gap-2" aria-label={COPY.category}>
              <For each={UNIFIED_WEAK_CHART_CATEGORIES}>
                {(value) => (
                  <span
                    title={UNIFIED_WEAK_CHART_CATEGORY_VIEW[value].hint}
                    class={`rounded px-3 py-1 text-sm ${UNIFIED_WEAK_CHART_CATEGORY_VIEW[value].class}`}
                  >
                    {UNIFIED_WEAK_CHART_CATEGORY_VIEW[value].label}{' '}
                    <span class="font-jost">
                      {entries().filter((entry) => entry.category === value).length}
                    </span>
                  </span>
                )}
              </For>
            </section>
            <h2 class="text-lg font-semibold">
              {COPY.results} <span class="font-jost text-text-muted">{filtered().length}</span>
            </h2>
            <Show
              when={filtered().length > 0}
              fallback={<p class="text-text-muted">{COPY.empty}</p>}
            >
              <UnifiedComparisonTable entries={filtered()} />
            </Show>
          </Show>
        </Show>
      </Show>
    </main>
  )
}

export default UnifiedWeakChartInspectorPage
