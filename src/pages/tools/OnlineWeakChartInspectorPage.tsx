import { Dialog } from '@kobalte/core/dialog'
import { NumberField } from '@kobalte/core/number-field'
import { A } from '@solidjs/router'
import { Chart, LinearScale, PointElement, ScatterController, Tooltip } from 'chart.js'
import { Globe, Minus, Plus, RotateCcw, Settings } from 'lucide-solid'
import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { fetchChartScores } from '../../api/chartScores'
import { fetchRatingBands } from '../../api/ratingBands'
import { fetchVersions } from '../../api/songs'
import { LoadError, Loading } from '../../components'
import { AppButton, AppIconButton } from '../../components/common/AppButton'
import { toMultiSelectOptions } from '../../components/common/AppMultiSelect'
import { AppSelect } from '../../components/common/AppSelect'
import { CheckboxField } from '../../components/common/CheckboxField'
import { createWindowVirtualTable } from '../../components/common/createWindowVirtualTable'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import { GenreMultiSelect, VersionMultiSelect } from '../../components/common/DomainMultiSelect'
import { getSortAriaValue, SortableHeaderButton } from '../../components/common/SortableTableHeader'
import { CHART_CONST_MAX, CHART_CONST_MIN, SCORE_THEORETICAL_MAX } from '../../constants/chart'
import { buildSongDetailPath } from '../../constants/routes'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import { useSongsData } from '../../stores/songsData'
import { accentPreference, themePreference } from '../../stores/themePreferences'
import type { RatingBandDTO } from '../../types/api'
import type { ChartScoresResponse } from '../../types/chartScores'
import { fetchUserRatingWithCache } from '../../usecases/cache/fetchUserRatingWithCache'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import { formatChartConst } from '../../utils/chartConstFormat'
import {
  CHART_SCATTER_TOOLTIP_CLASS,
  updateChartScatterTooltip,
} from '../../utils/chartScatterTooltip'
import { buildChartStatsAttributesBySongId } from '../../utils/chartStats'
import { CHART_COLOR_FALLBACK, resolveChartColor } from '../../utils/chartTheme'
import { formatInteger } from '../../utils/numberFormat'
import { clampNumericInput } from '../../utils/numberInput'
import {
  compareRecordsWithRatingBand,
  filterOnlineWeakChartEntries,
  formatOnlineWeakChartTooltipDetail,
  ONLINE_WEAK_CHART_OP_TARGET_FILTER,
  type OnlineWeakChartDifficulty,
  type OnlineWeakChartEntry,
  type OnlineWeakChartFilter,
  type OnlineWeakChartSortKey,
  resolveOnlineWeakChartScoreDifficulties,
  sortOnlineWeakChartEntries,
  toggleOnlineWeakChartDifficulty,
} from '../../utils/onlineWeakChartInspector'
import { ALL_RATING_BAND_LABEL, resolveInitialBestSlotRatingBand } from '../../utils/ratingBand'
import { formatScoreDifference, getScoreDifferenceClass } from '../../utils/scoreDifference'
import { nextSortState, type SortDirection } from '../../utils/sortingQuery'
import { buildTheoreticalOverPowerTargetDifficultyBySongId } from '../../utils/theoreticalOverPowerTarget'
import { getShortVersionName } from '../../utils/versionConverter'
import {
  ONLINE_WEAK_CHART_COPY,
  ONLINE_WEAK_CHART_DIFFICULTY_OPTIONS,
  ONLINE_WEAK_CHART_DISPLAY_SCORE_RANGE_MIN,
  ONLINE_WEAK_CHART_FILTER_DEFAULT,
  ONLINE_WEAK_CHART_POINT_JITTER,
} from './onlineWeakChartInspector.constants'

Chart.register(ScatterController, LinearScale, PointElement, Tooltip)

type RatingBandOption = { label: string; value: string }
type ComparisonPoint = { x: number; y: number; entry: OnlineWeakChartEntry }

/**
 * 設定画面に範囲内補正付きの数値欄を表示する。
 *
 * @param props - 入力値、範囲、刻み、ラベルと変更処理。
 * @returns 数値入力欄。
 */
const FilterNumberField = (props: {
  value: string
  min: number
  max: number
  step: number
  label: string
  onChange: (value: string) => void
}): JSX.Element => (
  <NumberField
    class="block flex-1"
    value={props.value}
    onChange={(value) => props.onChange(clampNumericInput(value, props.min, props.max))}
    format={false}
    allowedInput={props.step === 1 ? /[0-9]/ : /[0-9.]/}
    step={props.step}
  >
    <NumberField.Label class="sr-only">{props.label}</NumberField.Label>
    <NumberField.Input
      min={props.min}
      max={props.max}
      step={props.step}
      class="w-full rounded border border-border-strong bg-surface px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-inset focus:ring-focus-ring"
    />
  </NumberField>
)

/**
 * 選択した難易度の公開スコア統計を取得する。
 *
 * @param difficulties - 通常難易度または理論値OVER POWER対象の選択値。
 * @returns 難易度別の統計JSON。
 */
const fetchSelectedChartScores = (
  difficulties: OnlineWeakChartDifficulty[]
): Promise<ChartScoresResponse[]> =>
  Promise.all(resolveOnlineWeakChartScoreDifficulties(difficulties).map(fetchChartScores))

/**
 * 比較する譜面をグラフ上で識別できる散布図座標へ変換する。
 *
 * @param entries - 比較済みの譜面。
 * @returns 譜面定数と平均との差の点。
 */
const createComparisonPoints = (entries: OnlineWeakChartEntry[]): ComparisonPoint[] =>
  entries.map((entry, index) => ({
    x: entry.record.const + ((index % 7) - 3) * ONLINE_WEAK_CHART_POINT_JITTER,
    y: entry.difference,
    entry,
  }))

/**
 * 譜面定数ごとに平均との差を散布図で表示する。
 *
 * @param props.entries - 比較対象の譜面。
 * @param props.displayScoreRange - 縦軸に表示するスコア差の絶対値。
 * @returns 平均以下と平均以上を色分けした散布図。
 */
const OnlineWeakChartScatter = (props: {
  entries: OnlineWeakChartEntry[]
  displayScoreRange: number
}): JSX.Element => {
  let canvasRef!: HTMLCanvasElement
  let tooltipRef!: HTMLDivElement
  let chart: Chart<'scatter', ComparisonPoint[]> | undefined

  createEffect(() => {
    themePreference()
    accentPreference()
    const points = createComparisonPoints(props.entries)
    const chartConstRange = props.entries.reduce(
      (range, { record }) => ({
        min: Math.min(range.min, record.const),
        max: Math.max(range.max, record.const),
      }),
      { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
    )
    const textColor = resolveChartColor('--cs-color-text-muted', CHART_COLOR_FALLBACK)
    const gridColor = resolveChartColor('--cs-color-border', CHART_COLOR_FALLBACK)
    const lowerColor = resolveChartColor('--cs-color-weak-chart-outlier', CHART_COLOR_FALLBACK)
    const higherColor = resolveChartColor('--cs-color-weak-chart-point', CHART_COLOR_FALLBACK)

    chart?.destroy()
    chart = new Chart(canvasRef, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: ONLINE_WEAK_CHART_COPY.lowerDataset,
            data: points.filter((point) => point.y < 0),
            backgroundColor: lowerColor,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: ONLINE_WEAK_CHART_COPY.higherDataset,
            data: points.filter((point) => point.y >= 0),
            backgroundColor: higherColor,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: ({ tooltip }) =>
              updateChartScatterTooltip(tooltipRef, canvasRef, tooltip, (raw) => {
                const { entry } = raw as ComparisonPoint
                return {
                  record: entry.record,
                  detail: formatOnlineWeakChartTooltipDetail(entry.record, entry.difference),
                }
              }),
          },
        },
        scales: {
          x: {
            min: chartConstRange.min,
            max: chartConstRange.max,
            grid: { color: gridColor },
            ticks: { color: textColor },
          },
          y: {
            min: -props.displayScoreRange,
            max: props.displayScoreRange,
            grid: {
              color: (context) => (context.tick.value === 0 ? textColor : gridColor),
            },
            ticks: {
              color: textColor,
              callback: (value) => formatScoreDifference(Number(value)),
            },
          },
        },
      },
    })
  })

  onCleanup(() => chart?.destroy())

  return (
    <figure class="rounded-lg border border-border bg-surface p-4">
      <figcaption class="mb-3 font-semibold">{ONLINE_WEAK_CHART_COPY.chartTitle}</figcaption>
      <div class="overflow-x-auto overscroll-x-contain">
        <div class="h-112 min-w-[44rem]">
          <canvas ref={canvasRef} role="img" aria-label={ONLINE_WEAK_CHART_COPY.chartLabel} />
        </div>
      </div>
      <div ref={tooltipRef} class={CHART_SCATTER_TOOLTIP_CLASS} role="tooltip" />
    </figure>
  )
}

/** 仮想化で使用する比較表の固定行高。 */
const ONLINE_WEAK_CHART_TABLE_ROW_HEIGHT = 37
/** 比較表の仮想行と見出しで共有する列構成。 */
const ONLINE_WEAK_CHART_TABLE_GRID_TEMPLATE =
  'minmax(14rem, 1fr) 5.75rem 3rem 4.75rem 4.75rem 4.75rem'
/** 比較表の見出しセルに共通適用するクラス。苦手譜面インスペクターの表見出しと高さと字を揃える。 */
const ONLINE_WEAK_CHART_TABLE_HEADER_CLASS =
  'flex min-h-8 items-center whitespace-nowrap bg-surface-muted font-medium text-text-muted'
/** 比較表の仮想行セルに共通適用するクラス。 */
const ONLINE_WEAK_CHART_TABLE_CELL_CLASS = 'flex h-[37px] items-center'

type OnlineWeakChartTableProps = {
  /** 表示対象の比較結果。 */
  entries: readonly OnlineWeakChartEntry[]
  /** 条件変更時に仮想スクロールを先頭へ戻すためのキー。 */
  resetKey: string
}

/**
 * 比較結果をソート可能な仮想化表として表示する。
 *
 * @param props - 比較結果と条件変更を識別するキー。
 * @returns 曲名、難易度、定数、スコア、平均、点差を表示する表。
 */
const OnlineWeakChartTable = (props: OnlineWeakChartTableProps): JSX.Element => {
  const [sortKey, setSortKey] = createSignal<OnlineWeakChartSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const sortedEntries = createMemo(() =>
    sortOnlineWeakChartEntries(props.entries, sortKey(), sortDirection())
  )
  const virtualizedTable = createWindowVirtualTable<
    HTMLDivElement,
    HTMLTableSectionElement,
    HTMLDivElement,
    HTMLTableRowElement
  >({
    rowCount: () => sortedEntries().length,
    rowHeight: ONLINE_WEAK_CHART_TABLE_ROW_HEIGHT,
    resetOnRowCountChange: true,
    layoutDeps: () => props.resetKey,
  })
  const virtualRows = createMemo(() => virtualizedTable.virtualRows())

  createEffect((previousKey?: string) => {
    const currentKey = props.resetKey
    if (previousKey !== undefined && previousKey !== currentKey) {
      virtualizedTable.resetToTop()
    }
    return currentKey
  })

  /**
   * 列ヘッダー操作時の次のソート状態を適用し、表を先頭へ戻す。
   *
   * @param nextKey - 選択された列のソートキー。
   * @returns なし。
   */
  const handleSortChange = (nextKey: OnlineWeakChartSortKey): void => {
    const nextSort = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(nextSort.sortKey)
    setSortDirection(nextSort.sortDirection)
    virtualizedTable.resetToTop()
  }

  /**
   * ソート状態を表ヘッダーへ反映する。
   *
   * @param label - ヘッダーの表示名。
   * @param key - ヘッダーに対応するソートキー。
   * @param align - ヘッダー内容の配置。
   * @returns ソート操作可能なヘッダーボタン。
   */
  const header = (
    label: string,
    key: OnlineWeakChartSortKey,
    align: 'start' | 'center' = 'center'
  ): JSX.Element => (
    <SortableHeaderButton
      label={label}
      active={sortKey() === key}
      direction={sortDirection()}
      align={align}
      class={align === 'start' ? 'justify-start min-h-8!' : 'justify-center min-h-8!'}
      onClick={() => handleSortChange(key)}
    />
  )

  /**
   * ソート状態をth要素へ伝えるaria-sort値を返す。
   *
   * @param key - 列のソートキー。
   * @returns aria-sortへ渡すソート状態。
   */
  const headerAriaSort = (key: OnlineWeakChartSortKey) =>
    getSortAriaValue(sortKey() === key, sortDirection())

  return (
    <section class="rounded-lg border border-border bg-surface">
      <h2 class="border-b border-border px-4 py-3 text-lg font-semibold">
        {ONLINE_WEAK_CHART_COPY.tableTitle}
        <span class="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-sm text-text-muted">
          {props.entries.length}
        </span>
      </h2>
      <div
        ref={virtualizedTable.setTableContainerRef}
        class="overflow-x-auto overflow-y-hidden rounded-b-lg"
      >
        <table
          class="block w-full min-w-[37rem] text-sm"
          aria-rowcount={sortedEntries().length + 1}
        >
          <caption class="sr-only">{ONLINE_WEAK_CHART_COPY.tableCaption}</caption>
          <thead class="block">
            <tr
              class="grid"
              style={{ 'grid-template-columns': ONLINE_WEAK_CHART_TABLE_GRID_TEMPLATE }}
            >
              <th
                class={`${ONLINE_WEAK_CHART_TABLE_HEADER_CLASS} justify-start px-3 text-left`}
                scope="col"
                aria-sort={headerAriaSort('title')}
              >
                {header(ONLINE_WEAK_CHART_COPY.songTitle, 'title', 'start')}
              </th>
              <th
                class={`${ONLINE_WEAK_CHART_TABLE_HEADER_CLASS} justify-center px-0 text-center`}
                scope="col"
                aria-sort={headerAriaSort('difficulty')}
              >
                {header(ONLINE_WEAK_CHART_COPY.difficulty, 'difficulty')}
              </th>
              <th
                class={`${ONLINE_WEAK_CHART_TABLE_HEADER_CLASS} justify-center px-0 text-center`}
                scope="col"
                aria-sort={headerAriaSort('const')}
              >
                {header(ONLINE_WEAK_CHART_COPY.chartConst, 'const')}
              </th>
              <th
                class={`${ONLINE_WEAK_CHART_TABLE_HEADER_CLASS} justify-center px-0 text-center`}
                scope="col"
                aria-sort={headerAriaSort('score')}
              >
                {header(ONLINE_WEAK_CHART_COPY.ownScore, 'score')}
              </th>
              <th
                class={`${ONLINE_WEAK_CHART_TABLE_HEADER_CLASS} justify-center px-0 text-center`}
                scope="col"
                aria-sort={headerAriaSort('averageScore')}
              >
                {header(ONLINE_WEAK_CHART_COPY.averageScore, 'averageScore')}
              </th>
              <th
                class={`${ONLINE_WEAK_CHART_TABLE_HEADER_CLASS} justify-center px-0 text-center`}
                scope="col"
                aria-sort={headerAriaSort('difference')}
              >
                {header(ONLINE_WEAK_CHART_COPY.difference, 'difference')}
              </th>
            </tr>
          </thead>
          <tbody
            ref={virtualizedTable.setTableBodyRef}
            class="relative block min-w-full"
            style={{ height: `${virtualizedTable.getTotalSize()}px` }}
          >
            <For each={virtualRows()}>
              {(virtualRow) => {
                const entry = createMemo(() => sortedEntries()[virtualRow.index])

                return (
                  <Show when={entry()} keyed>
                    {(currentEntry) => (
                      <tr
                        class="absolute left-0 top-0 grid min-w-full border-t border-border hover:bg-surface-muted"
                        style={{
                          'grid-template-columns': ONLINE_WEAK_CHART_TABLE_GRID_TEMPLATE,
                          transform: `translateY(${virtualRow.start - virtualizedTable.scrollMargin()}px)`,
                        }}
                        aria-rowindex={virtualRow.index + 2}
                      >
                        <th
                          class={`${ONLINE_WEAK_CHART_TABLE_CELL_CLASS} min-w-0 p-0 text-left font-medium`}
                          scope="row"
                        >
                          <A
                            href={buildSongDetailPath(
                              currentEntry.record.id,
                              currentEntry.record.difficulty
                            )}
                            class="flex h-full w-full min-w-0 items-center px-3 font-sans text-link hover:text-link-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
                            title={currentEntry.record.title}
                          >
                            <span class="truncate">{currentEntry.record.title}</span>
                          </A>
                        </th>
                        <td
                          class={`${ONLINE_WEAK_CHART_TABLE_CELL_CLASS} justify-center px-0 text-center`}
                        >
                          <DifficultyBadge difficulty={currentEntry.record.difficulty} />
                        </td>
                        <td
                          class={`${ONLINE_WEAK_CHART_TABLE_CELL_CLASS} justify-center px-0 text-center font-jost tabular-nums`}
                        >
                          {formatChartConst(currentEntry.record.const)}
                        </td>
                        <td
                          class={`${ONLINE_WEAK_CHART_TABLE_CELL_CLASS} justify-center px-0 text-center font-jost tabular-nums`}
                        >
                          {formatInteger(currentEntry.record.score)}
                        </td>
                        <td
                          class={`${ONLINE_WEAK_CHART_TABLE_CELL_CLASS} justify-center px-0 text-center font-jost tabular-nums`}
                        >
                          {formatInteger(Math.trunc(currentEntry.averageScore))}
                        </td>
                        <td
                          class={`${ONLINE_WEAK_CHART_TABLE_CELL_CLASS} justify-center px-0 text-center font-jost tabular-nums ${getScoreDifferenceClass(currentEntry.difference)}`}
                        >
                          {formatScoreDifference(currentEntry.difference)}
                        </td>
                      </tr>
                    )}
                  </Show>
                )
              }}
            </For>
          </tbody>
        </table>
      </div>
    </section>
  )
}

/**
 * 同じレート帯との比較結果を表示する。
 *
 * @returns レート帯と難易度を選択できる散布図・譜面表。
 */
const OnlineWeakChartInspectorPage = (): JSX.Element => {
  useDocumentTitle(ONLINE_WEAK_CHART_COPY.title)
  const [ratingBandsResource] = createResource(fetchRatingBands)
  const [versionsResource] = createResource(fetchVersions)
  const { songsResponse, ensureSongsLoaded, isSongsLoading } = useSongsData()
  const username = () => authSession.user?.username ?? null
  const [ownRating] = createResource(username, fetchUserRatingWithCache)
  const [ownRecords] = createResource(username, fetchUserRecordWithCache)
  const [selectedBand, setSelectedBand] = createSignal<RatingBandOption | null>(null)
  const [filter, setFilter] = createSignal<OnlineWeakChartFilter>({
    ...ONLINE_WEAK_CHART_FILTER_DEFAULT,
  })
  const [settingsOpen, setSettingsOpen] = createSignal(false)
  const [editDifficulties, setEditDifficulties] = createSignal<OnlineWeakChartDifficulty[]>([])
  const [editDisplayScoreRange, setEditDisplayScoreRange] = createSignal('')
  const [editConstMin, setEditConstMin] = createSignal('')
  const [editConstMax, setEditConstMax] = createSignal('')
  const [editGenres, setEditGenres] = createSignal<string[] | null>(null)
  const [editVersions, setEditVersions] = createSignal<string[] | null>(null)
  let settingsContentRef!: HTMLDivElement
  const [scoreSnapshots] = createResource(
    () => [...filter().difficulties],
    fetchSelectedChartScores
  )

  onMount(() => ensureSongsLoaded())

  const ratingBandOptions = createMemo(() =>
    (ratingBandsResource() ?? [])
      .filter((band) => band.label !== ALL_RATING_BAND_LABEL)
      .sort((left, right) => right.sort_order - left.sort_order)
      .map((band: RatingBandDTO) => ({ label: band.label, value: band.label }))
  )

  const genreOptions = createMemo(() => {
    const songs = songsResponse()?.songs
    if (!songs) return []

    return [...new Set(songs.map((song) => song.genre))].sort((left, right) =>
      left.localeCompare(right, 'ja')
    )
  })
  const versionOptions = createMemo(() => versionsResource()?.versions ?? [])
  const versionNames = createMemo(() => versionOptions().map((version) => version.name))
  const attributesBySongId = createMemo(() => {
    const songs = songsResponse()?.songs
    const versions = versionsResource()?.versions
    if (!songs || !versions) return undefined

    return buildChartStatsAttributesBySongId(songs, versions)
  })
  const targetDifficultyBySongId = createMemo(() =>
    buildTheoreticalOverPowerTargetDifficultyBySongId(songsResponse()?.songs ?? [])
  )
  const isOpTargetSelected = () =>
    filter().difficulties.includes(ONLINE_WEAK_CHART_OP_TARGET_FILTER)

  createEffect(() => {
    if (selectedBand() || !ratingBandsResource() || ownRating.loading) return
    const band = resolveInitialBestSlotRatingBand(
      ratingBandsResource() ?? [],
      ownRating()?.best_average
    )
    if (band) setSelectedBand({ label: band.label, value: band.label })
  })

  const comparedEntries = createMemo(() =>
    compareRecordsWithRatingBand(
      ownRecords()?.standard ?? [],
      scoreSnapshots() ?? [],
      selectedBand()?.value ?? ''
    )
  )
  const entries = createMemo(() =>
    filterOnlineWeakChartEntries(
      comparedEntries(),
      filter(),
      attributesBySongId(),
      targetDifficultyBySongId()
    ).sort((left, right) => left.difference - right.difference)
  )
  const tableResetKey = createMemo(
    () => `${selectedBand()?.value ?? ''}|${JSON.stringify(filter())}`
  )
  const isLoading = () =>
    ratingBandsResource.loading ||
    ownRating.loading ||
    ownRecords.loading ||
    scoreSnapshots.loading ||
    (isOpTargetSelected() && isSongsLoading())
  const loadError = () =>
    ratingBandsResource.error ??
    ownRating.error ??
    ownRecords.error ??
    scoreSnapshots.error ??
    (isOpTargetSelected() ? songsResponse.error : undefined)

  /**
   * 対象難易度の選択状態を更新する。
   *
   * @param difficulty - 切り替える通常難易度または理論値OVER POWER対象。
   * @returns なし。
   */
  const toggleDifficulty = (difficulty: OnlineWeakChartDifficulty): void => {
    setEditDifficulties((current) => toggleOnlineWeakChartDifficulty(current, difficulty))
  }

  /**
   * 適用中の条件を編集欄へ反映して設定を開く。
   *
   * @returns なし。
   */
  const openSettings = (): void => {
    const currentFilter = filter()
    setEditDifficulties([...currentFilter.difficulties])
    setEditDisplayScoreRange(String(currentFilter.displayScoreRange))
    setEditConstMin(String(currentFilter.constMin))
    setEditConstMax(String(currentFilter.constMax))
    setEditGenres(currentFilter.genres === null ? null : [...currentFilter.genres])
    setEditVersions(currentFilter.versions === null ? null : [...currentFilter.versions])
    setSettingsOpen(true)
  }

  /**
   * 編集中の条件を初期値に戻す。
   *
   * @returns なし。
   */
  const resetSettings = (): void => {
    setEditDifficulties([...ONLINE_WEAK_CHART_FILTER_DEFAULT.difficulties])
    setEditDisplayScoreRange(String(ONLINE_WEAK_CHART_FILTER_DEFAULT.displayScoreRange))
    setEditConstMin(String(ONLINE_WEAK_CHART_FILTER_DEFAULT.constMin))
    setEditConstMax(String(ONLINE_WEAK_CHART_FILTER_DEFAULT.constMax))
    setEditGenres(null)
    setEditVersions(null)
  }

  /**
   * 編集中の範囲をグラフと表へ適用する。
   *
   * @returns なし。
   */
  const applySettings = (): void => {
    const displayScoreRange = Number(editDisplayScoreRange())
    const constMin = Number(editConstMin()) || CHART_CONST_MIN
    const constMax = Number(editConstMax()) || CHART_CONST_MAX
    setFilter({
      difficulties: [...editDifficulties()],
      displayScoreRange:
        displayScoreRange >= ONLINE_WEAK_CHART_DISPLAY_SCORE_RANGE_MIN
          ? displayScoreRange
          : ONLINE_WEAK_CHART_FILTER_DEFAULT.displayScoreRange,
      constMin: Math.min(constMin, constMax),
      constMax: Math.max(constMin, constMax),
      genres: editGenres(),
      versions: editVersions(),
    })
    setSettingsOpen(false)
  }

  /**
   * 設定の開閉を処理する。
   *
   * @param open - 次の開閉状態。
   * @returns なし。
   */
  const handleSettingsOpenChange = (open: boolean): void => {
    if (open) openSettings()
    else setSettingsOpen(false)
  }

  /**
   * 設定を開いた際にダイアログ本体へフォーカスする。
   *
   * @param event - 自動フォーカスイベント。
   * @returns なし。
   */
  const handleSettingsOpenAutoFocus = (event: Event): void => {
    event.preventDefault()
    settingsContentRef.focus()
  }

  return (
    <main class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <header class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
            <Globe class="h-5 w-5 text-action-primary" aria-hidden="true" />
          </span>
          <div>
            <h1 class="text-2xl font-semibold">{ONLINE_WEAK_CHART_COPY.title}</h1>
            <p class="mt-1 text-sm text-text-muted">{ONLINE_WEAK_CHART_COPY.description}</p>
          </div>
        </div>
        <AppIconButton
          tone="ghost"
          aria-label={ONLINE_WEAK_CHART_COPY.settingsOpen}
          onClick={openSettings}
          class="shrink-0"
        >
          <Settings class="h-5 w-5" aria-hidden="true" />
        </AppIconButton>
      </header>

      <div class="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-surface p-4">
        <Show when={selectedBand()}>
          <AppSelect<RatingBandOption>
            options={ratingBandOptions()}
            optionValue="value"
            optionTextValue="label"
            value={selectedBand()}
            onChange={(option) => {
              if (option) {
                setSelectedBand(option)
              }
            }}
            label={ONLINE_WEAK_CHART_COPY.ratingBand}
            rootClass="w-full sm:w-44"
            triggerClass="h-10"
            formatLabel={(option) => option.label}
          />
        </Show>
      </div>

      <Dialog open={settingsOpen()} onOpenChange={handleSettingsOpenChange} preventScroll={false}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
          <Dialog.Content
            ref={settingsContentRef}
            onOpenAutoFocus={handleSettingsOpenAutoFocus}
            class="fixed left-1/2 top-1/2 z-50 flex h-5/6 max-h-11/12 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-surface p-6 shadow-lg"
          >
            <div class="mb-4 flex shrink-0 items-center justify-between">
              <Dialog.Title class="text-lg font-bold">
                {ONLINE_WEAK_CHART_COPY.settingsTitle}
              </Dialog.Title>
              <AppIconButton
                tone="danger"
                aria-label={ONLINE_WEAK_CHART_COPY.reset}
                onClick={resetSettings}
              >
                <RotateCcw class="h-5 w-5" aria-hidden="true" />
              </AppIconButton>
            </div>
            <div class="scrollbar-none min-h-0 min-w-0 flex-1 basis-0 space-y-5 overflow-y-auto">
              <fieldset>
                <legend class="mb-2 text-sm font-semibold">
                  {ONLINE_WEAK_CHART_COPY.difficulty}
                </legend>
                <div class="flex flex-col items-start gap-1">
                  <For each={ONLINE_WEAK_CHART_DIFFICULTY_OPTIONS}>
                    {(option) => (
                      <CheckboxField
                        id={`online-weak-chart-${option.value}`}
                        checked={editDifficulties().includes(option.value)}
                        disabled={
                          editDifficulties().includes(ONLINE_WEAK_CHART_OP_TARGET_FILTER) &&
                          option.value !== ONLINE_WEAK_CHART_OP_TARGET_FILTER
                        }
                        onChange={() => toggleDifficulty(option.value)}
                        label={option.label}
                        textVariant="large"
                        class="relative flex items-center gap-2"
                      />
                    )}
                  </For>
                </div>
              </fieldset>
              <GenreMultiSelect
                options={toMultiSelectOptions(genreOptions())}
                selected={editGenres() ?? genreOptions()}
                onChange={(value) =>
                  setEditGenres(
                    value.length > 0 && value.length === genreOptions().length ? null : [...value]
                  )
                }
                placeholder={ONLINE_WEAK_CHART_COPY.filterUnselected}
                disabled={attributesBySongId() === undefined}
              />
              <VersionMultiSelect
                options={toMultiSelectOptions(versionNames(), getShortVersionName)}
                selected={editVersions() ?? versionNames()}
                onChange={(value) =>
                  setEditVersions(
                    value.length > 0 && value.length === versionNames().length ? null : [...value]
                  )
                }
                placeholder={ONLINE_WEAK_CHART_COPY.filterUnselected}
                disabled={attributesBySongId() === undefined}
              />
              <div class="space-y-1">
                <span class="block text-sm text-text-muted">
                  {ONLINE_WEAK_CHART_COPY.displayScoreRange}
                </span>
                <div class="flex items-center gap-2">
                  <span
                    class="flex shrink-0 flex-col items-center text-text-muted"
                    aria-hidden="true"
                  >
                    <Plus class="h-3 w-3" />
                    <Minus class="h-3 w-3" />
                  </span>
                  <FilterNumberField
                    value={editDisplayScoreRange()}
                    min={ONLINE_WEAK_CHART_DISPLAY_SCORE_RANGE_MIN}
                    max={SCORE_THEORETICAL_MAX}
                    step={1}
                    label={ONLINE_WEAK_CHART_COPY.displayScoreRange}
                    onChange={setEditDisplayScoreRange}
                  />
                </div>
              </div>
              <div class="space-y-1">
                <span class="block text-sm text-text-muted">
                  {ONLINE_WEAK_CHART_COPY.chartConstRange}
                </span>
                <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-center gap-2">
                  <FilterNumberField
                    value={editConstMin()}
                    min={CHART_CONST_MIN}
                    max={CHART_CONST_MAX}
                    step={0.1}
                    label={ONLINE_WEAK_CHART_COPY.chartConstMin}
                    onChange={setEditConstMin}
                  />
                  <span class="text-center text-text-muted" aria-hidden="true">
                    ～
                  </span>
                  <FilterNumberField
                    value={editConstMax()}
                    min={CHART_CONST_MIN}
                    max={CHART_CONST_MAX}
                    step={0.1}
                    label={ONLINE_WEAK_CHART_COPY.chartConstMax}
                    onChange={setEditConstMax}
                  />
                </div>
              </div>
            </div>
            <div class="mt-6 flex shrink-0 justify-end gap-2">
              <AppButton onClick={() => setSettingsOpen(false)}>
                {ONLINE_WEAK_CHART_COPY.cancel}
              </AppButton>
              <AppButton variant="primary" onClick={applySettings}>
                {ONLINE_WEAK_CHART_COPY.apply}
              </AppButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Show when={!loadError()} fallback={<LoadError error={loadError()} />}>
        <Show when={!isLoading()} fallback={<Loading />}>
          <Show
            when={entries().length > 0}
            fallback={
              <p class="rounded-lg border border-border bg-surface p-8 text-center text-text-muted">
                {ONLINE_WEAK_CHART_COPY.empty}
              </p>
            }
          >
            <OnlineWeakChartScatter
              entries={entries()}
              displayScoreRange={filter().displayScoreRange}
            />
            <OnlineWeakChartTable entries={entries()} resetKey={tableResetKey()} />
          </Show>
        </Show>
      </Show>
    </main>
  )
}

export default OnlineWeakChartInspectorPage
