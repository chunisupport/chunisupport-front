import { A } from '@solidjs/router'
import { Chart, LinearScale, type Plugin, PointElement, ScatterController, Tooltip } from 'chart.js'
import { ScanSearch, SearchX, Settings } from 'lucide-solid'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { fetchChartScores } from '../../api/chartScores'
import { fetchNameFolders } from '../../api/nameFolders'
import { fetchRatingBands } from '../../api/ratingBands'
import { fetchVersions } from '../../api/songs'
import { LoadError, Loading } from '../../components'
import { AppIconButton } from '../../components/common/AppButton'
import { AppSelect } from '../../components/common/AppSelect'
import { type AppTabOption, SegmentedToggleGroup } from '../../components/common/AppTabs'
import { ChartCanvasFrame } from '../../components/common/ChartCanvasFrame'
import { createWindowVirtualTable } from '../../components/common/createWindowVirtualTable'
import { RecordDifficultyBadge } from '../../components/common/record/RecordBadges'
import { SortableTableHeaderCell } from '../../components/common/SortableTableHeader'
import {
  COMPACT_VIRTUAL_TABLE_CELL_CLASS,
  COMPACT_VIRTUAL_TABLE_HEADER_CLASS,
  COMPACT_VIRTUAL_TABLE_ROW_HEIGHT,
} from '../../components/common/virtualTableStyles'
import { WeakChartSettingsDialog } from '../../components/common/WeakChartSettingsDialog'
import {
  WEAK_CHART_SETTINGS_COPY,
  WEAK_CHART_SETTINGS_DEFAULT,
} from '../../components/common/WeakChartSettingsDialog.constants'
import { buildSongDetailPath, UNIFIED_WEAK_CHART_INSPECTOR_PATH } from '../../constants/routes'
import { getToolLink } from '../../constants/tools'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import { useSongsData } from '../../stores/songsData'
import { accentPreference, themePreference } from '../../stores/themePreferences'
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
import {
  filterOnlineWeakChartEntries,
  isWeakChartDifficultySelected,
  ONLINE_WEAK_CHART_OP_TARGET_FILTER,
  resolveOnlineWeakChartScoreDifficulties,
  type WeakChartSettings,
} from '../../utils/onlineWeakChartInspector'
import { ALL_RATING_BAND_LABEL, resolveInitialBestSlotRatingBand } from '../../utils/ratingBand'
import { nextSortState, type SortDirection } from '../../utils/sortingQuery'
import { buildTheoreticalOverPowerTargetDifficultyBySongId } from '../../utils/theoreticalOverPowerTarget'
import {
  buildUnifiedWeakChartPoints,
  inspectUnifiedWeakCharts,
  sortUnifiedWeakChartEntries,
  toAptitudeBarSpan,
  toAptitudeLabelPlacement,
  UNIFIED_WEAK_CHART_APTITUDE_SCALE,
  UNIFIED_WEAK_CHART_CATEGORIES,
  UNIFIED_WEAK_CHART_ZONES,
  type UnifiedWeakChartCategory,
  type UnifiedWeakChartEntry,
  type UnifiedWeakChartPoint,
  type UnifiedWeakChartSortKey,
} from '../../utils/unifiedWeakChartInspector'
import {
  UNIFIED_WEAK_CHART_COPY as COPY,
  UNIFIED_WEAK_CHART_APTITUDE_AXIS_PADDING,
  UNIFIED_WEAK_CHART_APTITUDE_TICK_STEP,
  UNIFIED_WEAK_CHART_CATEGORY_VIEW,
  UNIFIED_WEAK_CHART_CONST_AXIS_PADDING,
  UNIFIED_WEAK_CHART_POINT_JITTER,
  UNIFIED_WEAK_CHART_POINT_ORDER,
  UNIFIED_WEAK_CHART_TABLE_GRID,
  UNIFIED_WEAK_CHART_ZONE_COLOR,
} from './unifiedWeakChartInspector.constants'

Chart.register(ScatterController, LinearScale, PointElement, Tooltip)

type BandOption = { label: string; value: string }
type CategoryFilter = UnifiedWeakChartCategory | 'all'

/** 散布図の縦軸の目盛り。得意度の下限から上限まで一定間隔で並べる。 */
const APTITUDE_TICKS = Array.from(
  {
    length:
      (UNIFIED_WEAK_CHART_APTITUDE_SCALE.max - UNIFIED_WEAK_CHART_APTITUDE_SCALE.min) /
        UNIFIED_WEAK_CHART_APTITUDE_TICK_STEP +
      1,
  },
  (_, index) => ({
    value: UNIFIED_WEAK_CHART_APTITUDE_SCALE.min + index * UNIFIED_WEAK_CHART_APTITUDE_TICK_STEP,
  })
)

/**
 * 譜面定数ごとの得意度を、判定の色で塗り分けた散布図で表示する。
 * 苦手・やや苦手・得意の得意度範囲は背景を判定の色で塗り、普段どおり（50）の線を強調する。
 * 判定で絞り込んでも点の位置と横軸の範囲が変わらないよう、点と軸は判定で絞り込む前の譜面から求める。
 * @param props.entries - 表示・集計範囲で絞り込み、判定では絞り込む前の統合分析結果。
 * @param props.category - 表示する判定。すべての場合は 'all'。
 * @returns 横軸が譜面定数、縦軸が得意度の散布図。
 */
const UnifiedWeakChartScatter = (props: {
  entries: UnifiedWeakChartEntry[]
  category: CategoryFilter
}): JSX.Element => {
  let canvasRef!: HTMLCanvasElement
  let tooltipRef!: HTMLDivElement
  let chart: Chart<'scatter', UnifiedWeakChartPoint[]> | undefined

  createEffect(() => {
    themePreference()
    accentPreference()
    const points = buildUnifiedWeakChartPoints(props.entries, UNIFIED_WEAK_CHART_POINT_JITTER)
    const consts = points.map((point) => point.entry.record.const)
    const textColor = resolveChartColor('--cs-color-text-muted', CHART_COLOR_FALLBACK)
    const gridColor = resolveChartColor('--cs-color-border', CHART_COLOR_FALLBACK)
    const zones = UNIFIED_WEAK_CHART_ZONES.map((zone) => ({
      ...zone,
      color: resolveChartColor(UNIFIED_WEAK_CHART_ZONE_COLOR[zone.category], CHART_COLOR_FALLBACK),
    }))
    const zonePlugin: Plugin<'scatter'> = {
      id: 'unifiedWeakChartZones',
      beforeDraw: ({ ctx, chartArea, scales }) => {
        const yScale = scales.y
        ctx.save()
        for (const zone of zones) {
          const top = yScale.getPixelForValue(Math.min(zone.to, yScale.max))
          const bottom = yScale.getPixelForValue(Math.max(zone.from, yScale.min))
          ctx.fillStyle = zone.color
          ctx.fillRect(chartArea.left, top, chartArea.right - chartArea.left, bottom - top)
        }
        ctx.restore()
      },
    }

    chart?.destroy()
    chart = new Chart(canvasRef, {
      type: 'scatter',
      data: {
        datasets: UNIFIED_WEAK_CHART_CATEGORIES.filter(
          (category) =>
            category !== 'unavailable' && (props.category === 'all' || props.category === category)
        ).map((category) => ({
          label: UNIFIED_WEAK_CHART_CATEGORY_VIEW[category].label,
          data: points.filter((point) => point.entry.category === category),
          backgroundColor: resolveChartColor(
            UNIFIED_WEAK_CHART_CATEGORY_VIEW[category].pointColor,
            CHART_COLOR_FALLBACK
          ),
          order: UNIFIED_WEAK_CHART_POINT_ORDER[category],
          pointRadius: category === 'normal' ? 3 : 4,
          pointHoverRadius: category === 'normal' ? 5 : 6,
        })),
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
                const { entry } = raw as UnifiedWeakChartPoint
                return {
                  record: entry.record,
                  detail: `${entry.record.difficulty} ${formatChartConst(entry.record.const)} / ${formatInteger(entry.record.score)} / ${COPY.aptitude} ${entry.aptitude}（${UNIFIED_WEAK_CHART_CATEGORY_VIEW[entry.category].label}）`,
                }
              }),
          },
        },
        scales: {
          x: {
            min: Math.min(...consts) - UNIFIED_WEAK_CHART_CONST_AXIS_PADDING,
            max: Math.max(...consts) + UNIFIED_WEAK_CHART_CONST_AXIS_PADDING,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              includeBounds: false,
              callback: (value) => formatChartConst(Number(value)),
            },
          },
          y: {
            min: UNIFIED_WEAK_CHART_APTITUDE_SCALE.min - UNIFIED_WEAK_CHART_APTITUDE_AXIS_PADDING,
            max: UNIFIED_WEAK_CHART_APTITUDE_SCALE.max + UNIFIED_WEAK_CHART_APTITUDE_AXIS_PADDING,
            afterBuildTicks: (axis) => {
              axis.ticks = APTITUDE_TICKS
            },
            grid: {
              color: (context) =>
                context.tick.value === UNIFIED_WEAK_CHART_APTITUDE_SCALE.center
                  ? textColor
                  : gridColor,
            },
            ticks: { color: textColor },
          },
        },
      },
      plugins: [zonePlugin],
    })
  })

  onCleanup(() => chart?.destroy())

  return (
    <figure class="rounded-lg border border-border bg-surface p-4">
      <figcaption class="mb-3 font-semibold">{COPY.chartTitle}</figcaption>
      <div class="overflow-x-auto overscroll-x-contain">
        <ChartCanvasFrame class="h-96 min-w-[44rem]">
          <canvas ref={canvasRef} role="img" aria-label={COPY.chartLabel} />
        </ChartCanvasFrame>
      </div>
      <div ref={tooltipRef} class={CHART_SCATTER_TOOLTIP_CLASS} role="tooltip" />
    </figure>
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
 * 得意度を、50を中心に左右へ伸びるバーと、その先端に重ねた数値で表示する。
 * 塗りは中心線から伸びて見えるよう、先端側だけを丸める。
 * 中心側の端は小数ピクセルの丸めで中心線とずれないよう、常に中心（50%）に固定する。
 * 中心線は塗りに隠れないよう、塗りより手前に描く。
 * 塗りが短く数値が収まらない場合は、数値を先端の外側に置く。
 * @param props - 得意度（データなしは null）と、バーの色を決める判定。
 * @returns 数値を重ねた得意度バー。得意度がない場合は欠損記号。
 */
const AptitudeMeter = (props: {
  aptitude: number | null
  category: UnifiedWeakChartCategory
}): JSX.Element => (
  <Show
    when={props.aptitude ?? undefined}
    fallback={<span class="text-text-subtle">{COPY.missing}</span>}
  >
    {(aptitude) => {
      const span = () => toAptitudeBarSpan(aptitude())
      const label = () => toAptitudeLabelPlacement(aptitude())
      return (
        <span class="relative block h-4 w-24 rounded-full bg-surface-muted">
          <span
            class={`absolute inset-y-0 ${UNIFIED_WEAK_CHART_CATEGORY_VIEW[props.category].barClass}`}
            classList={{
              'left-1/2 rounded-r-full': span().towardRight,
              'right-1/2 rounded-l-full': !span().towardRight,
            }}
            style={{ width: `${span().width}%` }}
            aria-hidden="true"
          />
          <span class="absolute inset-y-0 left-1/2 w-px bg-text-subtle" aria-hidden="true" />
          <span
            class="absolute inset-y-0 flex items-center px-0.5 font-jost text-xs font-medium leading-none tabular-nums"
            classList={{ 'text-text-inverse': label().inside }}
            style={{
              left: `${label().anchor}%`,
              transform: label().beforeAnchor ? 'translateX(-100%)' : undefined,
            }}
          >
            {aptitude()}
          </span>
        </span>
      )
    }}
  </Show>
)

/**
 * 判定と得意度による優先順位を仮想化テーブルで表示する。
 * 曲名のみ左寄せ、その他の列は Online 版の比較表と同じく中央揃えにする。
 * 列ヘッダーで昇順・降順・初期順（判定の優先順位）を切り替えられる。
 * @param props - 絞り込み済みの統合分析結果。
 * @returns 曲名リンク、難易度、定数、スコア、得意度、判定の表。
 */
const UnifiedComparisonTable = (props: { entries: UnifiedWeakChartEntry[] }): JSX.Element => {
  const [sortKey, setSortKey] = createSignal<UnifiedWeakChartSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const rows = createMemo(() =>
    sortUnifiedWeakChartEntries(props.entries, sortKey(), sortDirection())
  )
  const virtual = createWindowVirtualTable<HTMLElement, HTMLTableSectionElement>({
    rowCount: () => rows().length,
    rowHeight: COMPACT_VIRTUAL_TABLE_ROW_HEIGHT,
    resetOnRowCountChange: true,
    layoutDeps: rows,
  })
  createEffect((previous?: UnifiedWeakChartEntry[]) => {
    const current = rows()
    if (previous !== undefined && previous !== current) virtual.resetToTop()
    return current
  })
  const centeredHeaders: { label: string; key: UnifiedWeakChartSortKey }[] = [
    { label: COPY.difficulty, key: 'difficulty' },
    { label: COPY.constant, key: 'const' },
    { label: COPY.score, key: 'score' },
    { label: COPY.aptitude, key: 'aptitude' },
    { label: COPY.category, key: 'category' },
  ]

  /**
   * 列ヘッダー操作時の次のソート状態を適用する。
   * @param key - 選択された列のソートキー。
   * @returns なし。
   */
  const changeSort = (key: UnifiedWeakChartSortKey): void => {
    const next = nextSortState(sortKey(), sortDirection(), key)
    setSortKey(next.sortKey)
    setSortDirection(next.sortDirection)
  }
  return (
    <section
      ref={virtual.setTableContainerRef}
      class="overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-surface"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: 横スクロール領域をキーボードでも操作できるようにする。
      tabIndex={0}
      aria-label={COPY.results}
    >
      <table class="block w-full min-w-[37rem] text-sm" aria-rowcount={rows().length + 1}>
        <caption class="sr-only">{COPY.results}</caption>
        <thead class="block min-w-full">
          <tr class="grid" style={{ 'grid-template-columns': UNIFIED_WEAK_CHART_TABLE_GRID }}>
            <SortableTableHeaderCell
              label={COPY.title}
              active={sortKey() === 'title'}
              direction={sortDirection()}
              align="start"
              thClass={`${COMPACT_VIRTUAL_TABLE_HEADER_CLASS} justify-start px-3 text-left`}
              buttonClass="justify-start min-h-8!"
              onClick={() => changeSort('title')}
            />
            <For each={centeredHeaders}>
              {(header) => (
                <SortableTableHeaderCell
                  label={header.label}
                  active={sortKey() === header.key}
                  direction={sortDirection()}
                  thClass={`${COMPACT_VIRTUAL_TABLE_HEADER_CLASS} justify-center px-0 text-center`}
                  buttonClass="justify-center min-h-8!"
                  onClick={() => changeSort(header.key)}
                />
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
              const entry = createMemo(() => rows()[row.index])
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
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center`}
                      >
                        <AptitudeMeter aptitude={item.aptitude} category={item.category} />
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
 * 同レート帯の平均との失点比を、自分の普段の失点比と比べて判定する管理者向け画面。
 * @returns 比較帯・表示・集計範囲・判定を選べる、譜面定数別の得意度の散布図と優先順位表。
 */
const UnifiedWeakChartInspectorPage = (): JSX.Element => {
  const tool = getToolLink(UNIFIED_WEAK_CHART_INSPECTOR_PATH)
  useDocumentTitle(tool.title)
  const username = () => authSession.user?.username ?? null
  const [bands] = createResource(fetchRatingBands)
  const [versions] = createResource(fetchVersions)
  const [nameFolders] = createResource(fetchNameFolders)
  const { songsResponse, ensureSongsLoaded, isSongsLoading } = useSongsData()
  const [rating] = createResource(username, fetchUserRatingWithCache)
  const [records] = createResource(username, fetchUserRecordWithCache)
  const [settings, setSettings] = createSignal<WeakChartSettings>(WEAK_CHART_SETTINGS_DEFAULT)
  const [settingsOpen, setSettingsOpen] = createSignal(false)
  // 譜面定数・ジャンルなどの変更で統計の再取得と判定の再計算が走らないよう、難易度だけを比べる。
  const difficulties = createMemo(() => settings().difficulties, undefined, {
    equals: (previous, next) => previous.join() === next.join(),
  })
  const [snapshots] = createResource(
    () => resolveOnlineWeakChartScoreDifficulties(difficulties()),
    (selected) => Promise.all(selected.map(fetchChartScores))
  )
  const [band, setBand] = createSignal<BandOption | null>(null)
  const [category, setCategory] = createSignal<CategoryFilter>('all')

  onMount(() => ensureSongsLoaded())

  const bandOptions = createMemo(() =>
    (bands() ?? [])
      .filter((item) => item.label !== ALL_RATING_BAND_LABEL)
      .sort((a, b) => b.sort_order - a.sort_order)
      .map((item) => ({ label: item.label, value: item.label }))
  )
  const genreOptions = createMemo(() =>
    [...new Set((songsResponse()?.songs ?? []).map((song) => song.genre))].sort((left, right) =>
      left.localeCompare(right, 'ja')
    )
  )
  const versionNames = createMemo(() => (versions()?.versions ?? []).map((item) => item.name))
  const attributesBySongId = createMemo(() => {
    const songs = songsResponse()?.songs
    const versionList = versions()?.versions
    if (!songs || !versionList) return undefined
    return buildChartStatsAttributesBySongId(songs, versionList)
  })
  const targetDifficultyBySongId = createMemo(() =>
    buildTheoreticalOverPowerTargetDifficultyBySongId(songsResponse()?.songs ?? [])
  )
  const isOpTargetSelected = () => difficulties().includes(ONLINE_WEAK_CHART_OP_TARGET_FILTER)
  createEffect(() => {
    if (band() || !bands() || rating.loading) return
    const initial = resolveInitialBestSlotRatingBand(bands() ?? [], rating()?.best_average)
    if (initial) setBand({ label: initial.label, value: initial.label })
  })
  // 難易度は判定の集計範囲として、判定の前に絞り込む。
  const entries = createMemo(() =>
    inspectUnifiedWeakCharts(
      (records()?.standard ?? []).filter((record) =>
        isWeakChartDifficultySelected(record, difficulties(), targetDifficultyBySongId())
      ),
      snapshots() ?? [],
      band()?.value ?? ''
    )
  )
  // 譜面定数・ジャンル・バージョン・楽曲名順は、普段の失点比が変わらないよう判定の後に絞り込む。
  const displayed = createMemo(() =>
    filterOnlineWeakChartEntries(
      entries(),
      settings(),
      attributesBySongId(),
      targetDifficultyBySongId()
    )
  )
  const filtered = createMemo(() =>
    displayed().filter((entry) => category() === 'all' || entry.category === category())
  )
  const categoryOptions = createMemo((): AppTabOption<CategoryFilter>[] => [
    { value: 'all', label: <CategoryCount label={COPY.all} count={displayed().length} /> },
    ...UNIFIED_WEAK_CHART_CATEGORIES.map((value) => ({
      value,
      label: (
        <CategoryCount
          category={value}
          label={UNIFIED_WEAK_CHART_CATEGORY_VIEW[value].label}
          count={displayed().filter((entry) => entry.category === value).length}
        />
      ),
    })),
  ])
  const loading = () =>
    bands.loading ||
    rating.loading ||
    records.loading ||
    snapshots.loading ||
    (isOpTargetSelected() && isSongsLoading())
  const error = () =>
    bands.error ??
    rating.error ??
    records.error ??
    snapshots.error ??
    (isOpTargetSelected() ? songsResponse.error : undefined)

  return (
    <main class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <header class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <ScanSearch class="h-8 w-8 shrink-0 text-action-primary" aria-hidden="true" />
          <h1 class="text-2xl font-semibold">{tool.title}</h1>
        </div>
        <AppIconButton
          tone="ghost"
          aria-label={WEAK_CHART_SETTINGS_COPY.open}
          onClick={() => setSettingsOpen(true)}
          class="shrink-0"
        >
          <Settings class="h-5 w-5" aria-hidden="true" />
        </AppIconButton>
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
      </section>
      <WeakChartSettingsDialog
        open={settingsOpen()}
        onOpenChange={setSettingsOpen}
        value={settings()}
        defaults={WEAK_CHART_SETTINGS_DEFAULT}
        onApply={setSettings}
        genreOptions={genreOptions()}
        versionNames={versionNames()}
        nameFolders={nameFolders() ?? []}
        attributesReady={attributesBySongId() !== undefined}
        idPrefix="unified-weak-chart"
      />
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
              <Show when={filtered().some((entry) => entry.aptitude !== null)}>
                <UnifiedWeakChartScatter entries={displayed()} category={category()} />
              </Show>
              <UnifiedComparisonTable entries={filtered()} />
            </Show>
          </Show>
        </Show>
      </Show>
    </main>
  )
}

export default UnifiedWeakChartInspectorPage
