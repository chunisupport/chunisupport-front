import { Collapsible } from '@kobalte/core/collapsible'
import { Dialog } from '@kobalte/core/dialog'
import { NumberField } from '@kobalte/core/number-field'
import { A } from '@solidjs/router'
import {
  Chart,
  LinearScale,
  PointElement,
  ScatterController,
  Tooltip,
  type TooltipModel,
} from 'chart.js'
import {
  ChartNoAxesCombined,
  CircleCheckBig,
  RotateCcw,
  Settings,
  TriangleAlert,
} from 'lucide-solid'
import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  onCleanup,
  Show,
} from 'solid-js'
import { fetchMe } from '../../api/users'
import { LoadError, Loading } from '../../components'
import { AppButton, AppIconButton } from '../../components/common/AppButton'
import { AppDisclosureTrigger } from '../../components/common/AppDisclosureTrigger'
import { CheckboxField } from '../../components/common/CheckboxField'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import { getSortAriaValue, SortableHeaderButton } from '../../components/common/SortableTableHeader'
import {
  CHART_CONST_MAX,
  CHART_CONST_MIN,
  SCORE_MIN,
  SCORE_THEORETICAL_MAX,
} from '../../constants/chart'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { accentPreference, themePreference } from '../../stores/themePreferences'
import type { PlayerDataDifficulty, PlayerRecordDTO } from '../../types/api'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import { fetchTheoreticalTargetDifficultyBySongId } from '../../usecases/overpower/fetchTheoreticalTargetDifficulties'
import { formatChartConst, truncateChartConst } from '../../utils/chartConstFormat'
import { CHART_COLOR_FALLBACK, resolveChartColor } from '../../utils/chartTheme'
import { resolveViewportTooltipPosition } from '../../utils/chartTooltipPosition'
import { formatInteger, formatScoreKilo } from '../../utils/numberFormat'
import { clampNumericInput } from '../../utils/numberInput'
import { nextSortState, type SortDirection } from '../../utils/sortingQuery'
import {
  filterWeakChartAggregationRecords,
  inspectWeakCharts,
  isWeakChartInspectionTarget,
  sortWeakChartOutliers,
  toggleWeakChartAggregationDifficulty,
  WEAK_CHART_OP_TARGET_FILTER,
  type WeakChartAggregationDifficulty,
  type WeakChartAggregationRange,
  type WeakChartOutlier,
  type WeakChartSortKey,
} from '../../utils/weakChartInspector'
import {
  WEAK_CHART_AGGREGATION_DIFFICULTIES_DEFAULT,
  WEAK_CHART_AGGREGATION_DIFFICULTY_OPTIONS,
  WEAK_CHART_AGGREGATION_SETTINGS_DEFAULT,
  WEAK_CHART_AXIS_SETTINGS_DEFAULT,
  WEAK_CHART_INSPECTOR_COLORS,
  WEAK_CHART_INSPECTOR_COPY,
  WEAK_CHART_MIN_WIDTH_CLASS,
  WEAK_CHART_POINT_JITTER,
  WEAK_CHART_SCORE_TICK_INTERVAL,
  WEAK_CHART_SETTINGS_COPY,
  WEAK_CHART_TOOLTIP_POINT_GAP,
  WEAK_CHART_TOOLTIP_TITLE_CLASS,
  WEAK_CHART_TOOLTIP_VIEWPORT_PADDING,
} from './weakChartInspector.constants'

Chart.register(ScatterController, LinearScale, PointElement, Tooltip)

type ChartAxisSettings = {
  /** 縦軸（スコア）の最小値。 */
  yMin: number
  /** 縦軸（スコア）の最大値。 */
  yMax: number
  /** 横軸（譜面定数）の最小値。 */
  xMin: number
  /** 横軸（譜面定数）の最大値。 */
  xMax: number
}

type InspectorPoint = {
  x: number
  y: number
  record: PlayerRecordDTO
}

type SettingsNumberFieldProps = {
  /** 入力値。 */
  value: string
  /** 許容する最小値。 */
  min: number
  /** 許容する最大値。 */
  max: number
  /** 増減単位。 */
  step: number
  /** アクセシブルな入力名。 */
  label: string
  /** 入力値の更新処理。 */
  onChange: (value: string) => void
}

/** 外れ値表の表示内容。 */
type OutlierTableProps = {
  /** 表題に表示するアイコン。 */
  icon: JSX.Element
  /** 表題。 */
  title: string
  /** スクリーンリーダー向けの表題。 */
  caption: string
  /** 表示する外れ値譜面一覧。 */
  outliers: WeakChartOutlier[]
}

/**
 * グラフ設定で使用する範囲内補正付き数値入力を表示する。
 *
 * @param props - 入力値、数値制約、ラベル、変更ハンドラ。
 * @returns Kobalte NumberFieldを使った数値入力。
 */
const SettingsNumberField = (props: SettingsNumberFieldProps): JSX.Element => (
  <NumberField
    class="block"
    value={props.value}
    onChange={(value) => props.onChange(clampNumericInput(value, props.min, props.max))}
    format={false}
    allowedInput={/[0-9.]/}
    step={props.step}
  >
    <NumberField.Label class="sr-only">{props.label}</NumberField.Label>
    <NumberField.Input
      min={props.min}
      max={props.max}
      step={props.step}
      class="w-full rounded border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring"
    />
  </NumberField>
)

/**
 * Chart.js の tooltip に渡された raw 値を分析グラフの点として扱う。
 *
 * @param raw - Chart.js の tooltip が保持するデータ点。
 * @returns 苦手譜面分析グラフのデータ点。
 */
const toInspectorPoint = (raw: unknown): InspectorPoint => raw as InspectorPoint

/**
 * レコードの並びから重なりを抑えた散布図座標を作成する。
 *
 * @param records - プレイ済み譜面レコード。
 * @returns 譜面情報を保持した散布図座標。
 */
const createPoints = (records: PlayerRecordDTO[]): InspectorPoint[] =>
  records.map((record, index) => ({
    x: truncateChartConst(record.const) + ((index % 7) - 3) * (WEAK_CHART_POINT_JITTER / 3),
    y: record.score,
    record,
  }))

/**
 * 楽曲内の難易度まで識別できる譜面キーを生成する。
 *
 * @param record - キーを生成する通常譜面レコード。
 * @returns 楽曲IDと難易度を連結した譜面キー。
 */
const createChartKey = (record: PlayerRecordDTO): string => `${record.id}:${record.difficulty}`

/**
 * Chart.jsの外部ツールチップ要素を点の情報で更新する。
 *
 * @param tooltipElement - fixed配置で表示する外部ツールチップ要素。
 * @param canvas - ツールチップの基準になるCanvas要素。
 * @param tooltip - Chart.jsから渡されるツールチップ状態。
 * @returns なし。
 */
const updateExternalTooltip = (
  tooltipElement: HTMLDivElement,
  canvas: HTMLCanvasElement,
  tooltip: TooltipModel<'scatter'>
): void => {
  if (tooltip.opacity === 0 || tooltip.dataPoints.length === 0) {
    tooltipElement.style.opacity = '0'
    return
  }

  const dataPoint = tooltip.dataPoints[0]
  const record = toInspectorPoint(dataPoint.raw).record
  tooltipElement.replaceChildren()

  const titleElement = document.createElement('div')
  titleElement.className = WEAK_CHART_TOOLTIP_TITLE_CLASS
  titleElement.textContent = record.title

  const detailElement = document.createElement('div')
  detailElement.className = 'mt-1 text-text-muted'
  detailElement.textContent = `${record.difficulty} / 定数 ${formatChartConst(record.const)} / ${formatInteger(record.score)}`

  tooltipElement.append(titleElement, detailElement)

  const canvasRect = canvas.getBoundingClientRect()
  const tooltipRect = tooltipElement.getBoundingClientRect()
  const position = resolveViewportTooltipPosition(
    { left: tooltip.caretX, top: tooltip.caretY },
    { left: canvasRect.left, top: canvasRect.top },
    { width: tooltipRect.width, height: tooltipRect.height },
    { width: window.innerWidth, height: window.innerHeight },
    WEAK_CHART_TOOLTIP_VIEWPORT_PADDING,
    WEAK_CHART_TOOLTIP_POINT_GAP
  )

  tooltipElement.style.opacity = '1'
  tooltipElement.style.left = `${position.left}px`
  tooltipElement.style.top = `${position.top}px`
}

/**
 * 譜面定数別スコア分布をChart.jsで表示する。
 *
 * @param props - プレイ済みレコード、外れ値、グラフ軸設定。
 * @returns 譜面定数ごとのスコア散布図。
 */
const WeakChartDistributionChart = (props: {
  records: PlayerRecordDTO[]
  outliers: WeakChartOutlier[]
  axisSettings: ChartAxisSettings
}): JSX.Element => {
  let canvasRef!: HTMLCanvasElement
  let tooltipRef!: HTMLDivElement
  let chart: Chart<'scatter', InspectorPoint[]> | undefined

  createEffect(() => {
    themePreference()
    accentPreference()

    const records = props.records
    const axisSettings = props.axisSettings
    const outlierKeys = new Set(props.outliers.map(({ record }) => createChartKey(record)))
    const points = createPoints(records)
    const normalPoints = points.filter(({ record }) => !outlierKeys.has(createChartKey(record)))
    const outlierPoints = points.filter(({ record }) => outlierKeys.has(createChartKey(record)))
    const textColor = resolveChartColor(WEAK_CHART_INSPECTOR_COLORS.text, CHART_COLOR_FALLBACK)
    const gridColor = resolveChartColor(WEAK_CHART_INSPECTOR_COLORS.grid, CHART_COLOR_FALLBACK)
    const pointColor = resolveChartColor(WEAK_CHART_INSPECTOR_COLORS.point, CHART_COLOR_FALLBACK)
    const outlierColor = resolveChartColor(
      WEAK_CHART_INSPECTOR_COLORS.outlier,
      CHART_COLOR_FALLBACK
    )

    chart?.destroy()
    chart = new Chart(canvasRef, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: '獲得スコア',
            data: normalPoints,
            backgroundColor: pointColor,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
          {
            label: '外れ値',
            data: outlierPoints,
            backgroundColor: outlierColor,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointStyle: 'triangle',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
          tooltip: {
            enabled: false,
            external: ({ tooltip }) => updateExternalTooltip(tooltipRef, canvasRef, tooltip),
          },
        },
        scales: {
          x: {
            min: axisSettings.xMin,
            max: axisSettings.xMax,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: (value) => formatChartConst(Number(value)),
            },
          },
          y: {
            min: axisSettings.yMin,
            max: axisSettings.yMax,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              stepSize: WEAK_CHART_SCORE_TICK_INTERVAL,
              callback: (value) => formatScoreKilo(Number(value)),
            },
          },
        },
      },
    })
  })

  onCleanup(() => chart?.destroy())

  return (
    <figure class="rounded-lg border border-border bg-surface p-4">
      <figcaption class="mb-3 flex items-center gap-2 font-semibold">
        <ChartNoAxesCombined class="h-5 w-5 text-action-primary" aria-hidden="true" />
        <span>{WEAK_CHART_INSPECTOR_COPY.chartTitle}</span>
      </figcaption>
      <div class="overflow-x-auto overscroll-x-contain">
        <div class={`relative h-112 w-full ${WEAK_CHART_MIN_WIDTH_CLASS}`}>
          <canvas ref={canvasRef} aria-label={WEAK_CHART_INSPECTOR_COPY.chartAccessibleLabel} />
        </div>
      </div>
      <div
        ref={tooltipRef}
        class="pointer-events-none fixed z-50 max-w-[min(20rem,calc(100vw-1rem))] rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm opacity-0 shadow-lg transition-opacity"
        role="tooltip"
      />
    </figure>
  )
}

/**
 * 外れ値に該当した譜面を表で表示する。
 *
 * @param props - 表題、アイコン、外れ値譜面一覧。
 * @returns 外れ値のセマンティックなデータ表。
 */
const OutlierTable = (props: OutlierTableProps): JSX.Element => {
  const [sortKey, setSortKey] = createSignal<WeakChartSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const sortedOutliers = createMemo(() =>
    sortWeakChartOutliers(props.outliers, sortKey(), sortDirection())
  )

  /**
   * 既存レコード表と同じ3段階のソート状態を適用する。
   *
   * @param nextKey - 選択された列のソートキー。
   * @returns なし。
   */
  const handleSortChange = (nextKey: WeakChartSortKey): void => {
    const nextSort = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(nextSort.sortKey)
    setSortDirection(nextSort.sortDirection)
  }

  /**
   * ソート状態を反映した共通ヘッダーボタンを生成する。
   *
   * @param label - 列の表示名。
   * @param key - 列のソートキー。
   * @param align - ヘッダー内容の配置。
   * @returns ソート操作可能なヘッダーボタン。
   */
  const header = (label: string, key: WeakChartSortKey, align?: 'start' | 'center') => (
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
  const headerAriaSort = (key: WeakChartSortKey) =>
    getSortAriaValue(sortKey() === key, sortDirection())

  return (
    <section class="rounded-lg border border-border bg-surface">
      <h2 class="flex items-center gap-2 border-b border-border px-4 py-3 text-lg font-semibold">
        {props.icon}
        {props.title}
        <span class="rounded-full bg-surface-muted px-2 py-0.5 text-sm text-text-muted">
          {props.outliers.length}
        </span>
      </h2>
      <Show
        when={props.outliers.length > 0}
        fallback={
          <p class="p-6 text-center text-sm text-text-muted">
            {WEAK_CHART_INSPECTOR_COPY.emptyOutliers}
          </p>
        }
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-120 table-fixed border-collapse text-sm">
            <caption class="sr-only">{props.caption}</caption>
            <colgroup>
              <col />
              <col class="w-23" />
              <col class="w-12" />
              <col class="w-19" />
            </colgroup>
            <thead class="bg-surface-muted text-left text-text-muted">
              <tr class="[&>*:first-child]:pl-2 [&>*:last-child]:pr-2">
                <th scope="col" class="font-medium" aria-sort={headerAriaSort('title')}>
                  {header('曲名', 'title', 'start')}
                </th>
                <th scope="col" class="font-medium" aria-sort={headerAriaSort('difficulty')}>
                  {header('難易度', 'difficulty')}
                </th>
                <th scope="col" class="font-medium" aria-sort={headerAriaSort('const')}>
                  {header('定数', 'const')}
                </th>
                <th scope="col" class="font-medium" aria-sort={headerAriaSort('score')}>
                  {header('スコア', 'score')}
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={sortedOutliers()}>
                {({ record }) => (
                  <tr class="border-t border-border [&>*:first-child]:pl-2 [&>*:last-child]:pr-2">
                    <td class="overflow-hidden py-1.5 font-sans font-medium">
                      <A
                        href={`/songs/${encodeURIComponent(record.id)}`}
                        class="block truncate text-link text-wrap-nowrap hover:text-link-hover hover:underline"
                        title={record.title}
                      >
                        {record.title}
                      </A>
                    </td>
                    <td class="py-1.5 text-center">
                      <DifficultyBadge difficulty={record.difficulty} />
                    </td>
                    <td class="py-1.5 text-center font-jost">{formatChartConst(record.const)}</td>
                    <td class="py-1.5 text-center font-jost">{formatInteger(record.score)}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </section>
  )
}

/** 苦手譜面インスペクターの表示と集計に必要な取得データ。 */
type WeakChartInspectorData = {
  /** ログインユーザーの通常譜面レコード。 */
  records: PlayerRecordDTO[]
  /** 曲IDごとの理論値OVER POWER対象難易度。 */
  targetDifficultyBySongId: Map<string, PlayerDataDifficulty>
}

/**
 * ログインユーザーのレコードと楽曲マスタを取得する。
 *
 * @returns 苦手譜面インスペクターで使用するレコードと楽曲マスタ。
 */
const fetchWeakChartInspectorData = async (): Promise<WeakChartInspectorData> => {
  const me = await fetchMe()
  const [records, targetDifficultyBySongId] = await Promise.all([
    fetchUserRecordWithCache(me.username),
    fetchTheoreticalTargetDifficultyBySongId(),
  ])

  return {
    records: records.standard,
    targetDifficultyBySongId,
  }
}

/**
 * ログイン中ユーザーの苦手譜面分析画面を表示する。
 *
 * @returns 散布図と外れ値表を含むツール画面。
 */
const WeakChartInspectorPage = (): JSX.Element => {
  useDocumentTitle(WEAK_CHART_INSPECTOR_COPY.title)
  const [data] = createResource(fetchWeakChartInspectorData)
  const analysisRecords = createMemo(() =>
    (data()?.records ?? []).filter(isWeakChartInspectionTarget)
  )
  const [aggregationSettings, setAggregationSettings] = createSignal<WeakChartAggregationRange>({
    ...WEAK_CHART_AGGREGATION_SETTINGS_DEFAULT,
  })
  const [aggregationDifficulties, setAggregationDifficulties] = createSignal<
    WeakChartAggregationDifficulty[]
  >([...WEAK_CHART_AGGREGATION_DIFFICULTIES_DEFAULT])
  const aggregationRecords = createMemo(() => {
    const currentData = data()
    if (!currentData) return []

    return filterWeakChartAggregationRecords(
      currentData.records,
      currentData.targetDifficultyBySongId,
      aggregationDifficulties(),
      aggregationSettings()
    )
  })
  const inspection = createMemo(() => inspectWeakCharts(aggregationRecords()))
  /** 下方向の外れ値だけを苦手候補として抽出する。 */
  const lowerOutliers = createMemo(() =>
    inspection().outliers.filter((outlier) => outlier.direction === 'LOW')
  )
  /** 上方向の外れ値だけを得意候補として抽出する。 */
  const higherOutliers = createMemo(() =>
    inspection().outliers.filter((outlier) => outlier.direction === 'HIGH')
  )

  // グラフ設定 state
  const [axisSettings, setAxisSettings] = createSignal<ChartAxisSettings>({
    ...WEAK_CHART_AXIS_SETTINGS_DEFAULT,
  })
  const [settingsOpen, setSettingsOpen] = createSignal(false)
  let settingsContentRef!: HTMLDivElement

  // 表示の絞り込み 編集中
  const [editYMin, setEditYMin] = createSignal('')
  const [editYMax, setEditYMax] = createSignal('')
  const [editXMin, setEditXMin] = createSignal('')
  const [editXMax, setEditXMax] = createSignal('')

  // 集計対象の絞り込み 編集中
  const [editAggScoreMin, setEditAggScoreMin] = createSignal('')
  const [editAggScoreMax, setEditAggScoreMax] = createSignal('')
  const [editAggConstMin, setEditAggConstMin] = createSignal('')
  const [editAggConstMax, setEditAggConstMax] = createSignal('')

  /** 集計対象難易度 編集中 */
  const [editAggDifficulties, setEditAggDifficulties] = createSignal<
    WeakChartAggregationDifficulty[]
  >([...WEAK_CHART_AGGREGATION_DIFFICULTIES_DEFAULT])

  /**
   * 設定ダイアログを開き、現在の値を編集状態へ反映する。
   *
   * @returns なし。
   */
  const openSettings = (): void => {
    setEditYMin(String(axisSettings().yMin))
    setEditYMax(String(axisSettings().yMax))
    setEditXMin(String(axisSettings().xMin))
    setEditXMax(String(axisSettings().xMax))
    setEditAggScoreMin(String(aggregationSettings().scoreMin))
    setEditAggScoreMax(String(aggregationSettings().scoreMax))
    setEditAggConstMin(String(aggregationSettings().constMin))
    setEditAggConstMax(String(aggregationSettings().constMax))
    setEditAggDifficulties([...aggregationDifficulties()])
    setSettingsOpen(true)
  }

  /**
   * 設定ダイアログを閉じて編集内容を破棄する。
   *
   * @returns なし。
   */
  const cancelSettings = (): void => {
    setSettingsOpen(false)
  }

  /**
   * 編集内容を反映してダイアログを閉じる。
   *
   * @returns なし。
   */
  const applySettings = (): void => {
    setAxisSettings({
      yMin: Number(editYMin()),
      yMax: Number(editYMax()),
      xMin: Number(editXMin()),
      xMax: Number(editXMax()),
    })
    setAggregationSettings({
      scoreMin: Number(editAggScoreMin()),
      scoreMax: Number(editAggScoreMax()),
      constMin: Number(editAggConstMin()),
      constMax: Number(editAggConstMax()),
    })
    setAggregationDifficulties([...editAggDifficulties()])
    setSettingsOpen(false)
  }

  /**
   * 編集状態を初期値へ戻す。
   *
   * @returns なし。
   */
  const resetSettings = (): void => {
    setEditYMin(String(WEAK_CHART_AXIS_SETTINGS_DEFAULT.yMin))
    setEditYMax(String(WEAK_CHART_AXIS_SETTINGS_DEFAULT.yMax))
    setEditXMin(String(WEAK_CHART_AXIS_SETTINGS_DEFAULT.xMin))
    setEditXMax(String(WEAK_CHART_AXIS_SETTINGS_DEFAULT.xMax))
    setEditAggScoreMin(String(WEAK_CHART_AGGREGATION_SETTINGS_DEFAULT.scoreMin))
    setEditAggScoreMax(String(WEAK_CHART_AGGREGATION_SETTINGS_DEFAULT.scoreMax))
    setEditAggConstMin(String(WEAK_CHART_AGGREGATION_SETTINGS_DEFAULT.constMin))
    setEditAggConstMax(String(WEAK_CHART_AGGREGATION_SETTINGS_DEFAULT.constMax))
    setEditAggDifficulties([...WEAK_CHART_AGGREGATION_DIFFICULTIES_DEFAULT])
  }

  /**
   * 設定ダイアログの開閉を変更する。
   *
   * @param open - 次の開閉状態。
   * @returns なし。
   */
  const handleSettingsOpenChange = (open: boolean): void => {
    if (open) {
      openSettings()
    } else {
      setSettingsOpen(false)
    }
  }

  /**
   * 設定ダイアログを開いた際、入力欄ではなくダイアログ本体へフォーカスする。
   *
   * @param event - Kobalte が発行する自動フォーカスイベント。
   * @returns なし。
   */
  const handleSettingsOpenAutoFocus = (event: Event): void => {
    event.preventDefault()
    settingsContentRef.focus()
  }

  return (
    <ErrorBoundary fallback={(error) => <LoadError error={error} />}>
      <main class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
        <div class="flex items-center justify-between gap-4">
          <header class="flex items-start gap-3">
            <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
              <ChartNoAxesCombined class="h-5 w-5 text-action-primary" aria-hidden="true" />
            </span>
            <div>
              <h1 class="text-2xl font-semibold">{WEAK_CHART_INSPECTOR_COPY.title}</h1>
              <p class="mt-1 text-sm text-text-muted">{WEAK_CHART_INSPECTOR_COPY.description}</p>
            </div>
          </header>
          <Show when={!data.loading && analysisRecords().length > 0}>
            <AppIconButton
              tone="ghost"
              aria-label="グラフ設定を開く"
              onClick={openSettings}
              class="shrink-0"
            >
              <Settings class="h-5 w-5" aria-hidden="true" />
            </AppIconButton>
          </Show>
        </div>
        <Show when={!data.loading} fallback={<Loading />}>
          <Show
            when={analysisRecords().length > 0}
            fallback={
              <div class="rounded-lg border border-border bg-surface p-8 text-center text-text-muted">
                {WEAK_CHART_INSPECTOR_COPY.emptyRecords}
              </div>
            }
          >
            <WeakChartDistributionChart
              records={aggregationRecords()}
              outliers={inspection().outliers}
              axisSettings={axisSettings()}
            />
            <Show when={higherOutliers().length > 0}>
              <OutlierTable
                icon={<CircleCheckBig class="h-5 w-5 text-success" aria-hidden="true" />}
                title={WEAK_CHART_INSPECTOR_COPY.highOutlierTitle}
                caption={WEAK_CHART_INSPECTOR_COPY.highOutlierTableCaption}
                outliers={higherOutliers()}
              />
            </Show>
            <OutlierTable
              icon={<TriangleAlert class="h-5 w-5 text-warning" aria-hidden="true" />}
              title={WEAK_CHART_INSPECTOR_COPY.outlierTitle}
              caption={WEAK_CHART_INSPECTOR_COPY.tableCaption}
              outliers={lowerOutliers()}
            />

            {/* グラフ設定ダイアログ */}
            <Dialog
              open={settingsOpen()}
              onOpenChange={handleSettingsOpenChange}
              preventScroll={false}
            >
              <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 bg-overlay z-40" />
                <Dialog.Content
                  ref={settingsContentRef}
                  onOpenAutoFocus={handleSettingsOpenAutoFocus}
                  class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-lg shadow-lg p-6 w-[90vw] max-w-md flex flex-col select-none"
                >
                  <div class="flex items-center justify-between mb-4 shrink-0">
                    <Dialog.Title class="text-lg font-bold">
                      {WEAK_CHART_SETTINGS_COPY.title}
                    </Dialog.Title>
                    <AppIconButton
                      tone="danger"
                      aria-label={WEAK_CHART_SETTINGS_COPY.reset}
                      onClick={resetSettings}
                    >
                      <RotateCcw class="h-5 w-5" aria-hidden="true" />
                    </AppIconButton>
                  </div>

                  <div class="flex flex-col gap-5">
                    {/* 集計対象の絞り込み */}
                    <fieldset>
                      <legend class="mb-2 text-sm font-semibold text-text">
                        {WEAK_CHART_SETTINGS_COPY.aggregationSection}
                      </legend>
                      <div class="space-y-3">
                        {/* 難易度 */}
                        <div>
                          <span class="mb-1 block text-sm font-medium text-text-muted">難易度</span>
                          <div class="flex flex-col items-start gap-1">
                            <For each={WEAK_CHART_AGGREGATION_DIFFICULTY_OPTIONS}>
                              {(option) => (
                                <CheckboxField
                                  id={`agg-difficulty-${option.value}`}
                                  checked={editAggDifficulties().includes(option.value)}
                                  disabled={
                                    editAggDifficulties().includes(WEAK_CHART_OP_TARGET_FILTER) &&
                                    option.value !== WEAK_CHART_OP_TARGET_FILTER
                                  }
                                  onChange={() => {
                                    setEditAggDifficulties((prev) =>
                                      toggleWeakChartAggregationDifficulty(prev, option.value)
                                    )
                                  }}
                                  class="relative flex items-center gap-2"
                                  textVariant="large"
                                  labelClass="leading-5"
                                  label={option.label}
                                />
                              )}
                            </For>
                          </div>
                        </div>
                        {/* スコア範囲 */}
                        <div class="space-y-1">
                          <span class="block text-sm text-text-muted">
                            {WEAK_CHART_SETTINGS_COPY.scoreRangeLabel}
                          </span>
                          <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
                            <SettingsNumberField
                              value={editAggScoreMin()}
                              min={SCORE_MIN}
                              max={SCORE_THEORETICAL_MAX}
                              step={1}
                              label="集計対象 スコア 最小"
                              onChange={setEditAggScoreMin}
                            />
                            <div class="flex h-10 items-center justify-center text-lg font-medium leading-none text-text-muted">
                              <span aria-hidden="true">～</span>
                            </div>
                            <SettingsNumberField
                              value={editAggScoreMax()}
                              min={SCORE_MIN}
                              max={SCORE_THEORETICAL_MAX}
                              step={1}
                              label="集計対象 スコア 最大"
                              onChange={setEditAggScoreMax}
                            />
                          </div>
                        </div>
                        {/* 譜面定数範囲 */}
                        <div class="space-y-1">
                          <span class="block text-sm text-text-muted">
                            {WEAK_CHART_SETTINGS_COPY.constRangeLabel}
                          </span>
                          <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
                            <SettingsNumberField
                              value={editAggConstMin()}
                              min={CHART_CONST_MIN}
                              max={CHART_CONST_MAX}
                              step={0.1}
                              label="集計対象 譜面定数 最小"
                              onChange={setEditAggConstMin}
                            />
                            <div class="flex h-10 items-center justify-center text-lg font-medium leading-none text-text-muted">
                              <span aria-hidden="true">～</span>
                            </div>
                            <SettingsNumberField
                              value={editAggConstMax()}
                              min={CHART_CONST_MIN}
                              max={CHART_CONST_MAX}
                              step={0.1}
                              label="集計対象 譜面定数 最大"
                              onChange={setEditAggConstMax}
                            />
                          </div>
                        </div>
                      </div>
                    </fieldset>

                    {/* 表示の絞り込み */}
                    <Collapsible defaultOpen={false}>
                      <AppDisclosureTrigger
                        variant="compact"
                        label={WEAK_CHART_SETTINGS_COPY.displaySection}
                        labelClass="flex-none"
                      />
                      <Collapsible.Content>
                        <fieldset class="mt-3">
                          <legend class="sr-only">{WEAK_CHART_SETTINGS_COPY.displaySection}</legend>
                          <div class="space-y-3">
                            {/* スコア範囲 */}
                            <div class="space-y-1">
                              <span class="block text-sm text-text-muted">
                                {WEAK_CHART_SETTINGS_COPY.scoreRangeLabel}
                              </span>
                              <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
                                <SettingsNumberField
                                  value={editYMin()}
                                  min={SCORE_MIN}
                                  max={SCORE_THEORETICAL_MAX}
                                  step={1}
                                  label="表示の絞り込み スコア 最小"
                                  onChange={setEditYMin}
                                />
                                <div class="flex h-10 items-center justify-center text-lg font-medium leading-none text-text-muted">
                                  <span aria-hidden="true">～</span>
                                </div>
                                <SettingsNumberField
                                  value={editYMax()}
                                  min={SCORE_MIN}
                                  max={SCORE_THEORETICAL_MAX}
                                  step={1}
                                  label="表示の絞り込み スコア 最大"
                                  onChange={setEditYMax}
                                />
                              </div>
                            </div>
                            {/* 譜面定数範囲 */}
                            <div class="space-y-1">
                              <span class="block text-sm text-text-muted">
                                {WEAK_CHART_SETTINGS_COPY.constRangeLabel}
                              </span>
                              <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
                                <SettingsNumberField
                                  value={editXMin()}
                                  min={CHART_CONST_MIN}
                                  max={CHART_CONST_MAX}
                                  step={0.1}
                                  label="表示の絞り込み 譜面定数 最小"
                                  onChange={setEditXMin}
                                />
                                <div class="flex h-10 items-center justify-center text-lg font-medium leading-none text-text-muted">
                                  <span aria-hidden="true">～</span>
                                </div>
                                <SettingsNumberField
                                  value={editXMax()}
                                  min={CHART_CONST_MIN}
                                  max={CHART_CONST_MAX}
                                  step={0.1}
                                  label="表示の絞り込み 譜面定数 最大"
                                  onChange={setEditXMax}
                                />
                              </div>
                            </div>
                          </div>
                        </fieldset>
                      </Collapsible.Content>
                    </Collapsible>
                  </div>

                  <div class="flex justify-end mt-6">
                    <div class="flex gap-2">
                      <AppButton onClick={cancelSettings}>
                        {WEAK_CHART_SETTINGS_COPY.cancel}
                      </AppButton>
                      <AppButton variant="primary" onClick={applySettings}>
                        {WEAK_CHART_SETTINGS_COPY.apply}
                      </AppButton>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog>
          </Show>
        </Show>
      </main>
    </ErrorBoundary>
  )
}

export default WeakChartInspectorPage
