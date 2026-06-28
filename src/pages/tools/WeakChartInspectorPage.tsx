import { Button } from '@kobalte/core/button'
import { Checkbox } from '@kobalte/core/checkbox'
import { Collapsible } from '@kobalte/core/collapsible'
import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { A } from '@solidjs/router'
import { Chart, LinearScale, PointElement, ScatterController, Tooltip } from 'chart.js'
import {
  ChartNoAxesCombined,
  Check,
  ChevronRight,
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
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import {
  CHART_CONST_MAX,
  CHART_CONST_MIN,
  SCORE_MIN,
  SCORE_THEORETICAL_MAX,
} from '../../constants/chart'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { PlayerRecordDTO } from '../../types/api'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import {
  type ChartScoreDistribution,
  inspectWeakCharts,
  isWeakChartDisplayTarget,
  isWeakChartInspectionTarget,
  sortWeakChartOutliers,
  type WeakChartOutlier,
  type WeakChartSortKey,
} from '../../utils/weakChartInspector'
import { RecordHeaderButton } from '../users/components/SharedRecordTableColumns'
import { nextSortState, type SortDirection } from '../users/recordTable/sortingQuery'
import {
  WEAK_CHART_AGGREGATION_DIFFICULTIES,
  WEAK_CHART_AGGREGATION_DIFFICULTIES_DEFAULT,
  WEAK_CHART_AGGREGATION_SETTINGS_DEFAULT,
  WEAK_CHART_AXIS_SETTINGS_DEFAULT,
  WEAK_CHART_INSPECTOR_COLORS,
  WEAK_CHART_INSPECTOR_COPY,
  WEAK_CHART_MIN_WIDTH_CLASS,
  WEAK_CHART_POINT_JITTER,
  WEAK_CHART_SCORE_TICK_INTERVAL,
  WEAK_CHART_SETTINGS_COPY,
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

type ChartAggregationSettings = {
  /** 集計対象とするスコアの最小値。 */
  scoreMin: number
  /** 集計対象とするスコアの最大値。 */
  scoreMax: number
  /** 集計対象とする譜面定数の最小値。 */
  constMin: number
  /** 集計対象とする譜面定数の最大値。 */
  constMax: number
}

type InspectorPoint = {
  x: number
  y: number
  record: PlayerRecordDTO
}

/**
 * Chart.js の tooltip に渡された raw 値を分析グラフの点として扱う。
 *
 * @param raw - Chart.js の tooltip が保持するデータ点。
 * @returns 苦手譜面分析グラフのデータ点。
 */
const toInspectorPoint = (raw: unknown): InspectorPoint => raw as InspectorPoint

/**
 * CSSカスタムプロパティの解決済み色値を取得する。
 *
 * @param variableName - CSSカスタムプロパティ名。
 * @returns Chart.jsへ渡す色値。
 */
const getColor = (variableName: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()

/**
 * レコードの並びから重なりを抑えた散布図座標を作成する。
 *
 * @param records - プレイ済み譜面レコード。
 * @returns 譜面情報を保持した散布図座標。
 */
const createPoints = (records: PlayerRecordDTO[]): InspectorPoint[] =>
  records.map((record, index) => ({
    x: Number(record.const.toFixed(1)) + ((index % 7) - 3) * (WEAK_CHART_POINT_JITTER / 3),
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
 * 譜面定数別スコア分布をChart.jsで表示する。
 *
 * @param props - プレイ済みレコード、譜面定数別統計、外れ値。
 * @returns 譜面定数ごとのスコア散布図。
 */
const WeakChartDistributionChart = (props: {
  records: PlayerRecordDTO[]
  distributions: ChartScoreDistribution[]
  outliers: WeakChartOutlier[]
  axisSettings: ChartAxisSettings
  onOpenSettings: () => void
}): JSX.Element => {
  let canvasRef!: HTMLCanvasElement
  let chart: Chart<'scatter', InspectorPoint[]> | undefined

  createEffect(() => {
    const records = props.records
    const axisSettings = props.axisSettings
    const outlierKeys = new Set(props.outliers.map(({ record }) => createChartKey(record)))
    const points = createPoints(records)
    const normalPoints = points.filter(({ record }) => !outlierKeys.has(createChartKey(record)))
    const outlierPoints = points.filter(({ record }) => outlierKeys.has(createChartKey(record)))
    const textColor = getColor(WEAK_CHART_INSPECTOR_COLORS.text)
    const gridColor = getColor(WEAK_CHART_INSPECTOR_COLORS.grid)
    const pointColor = getColor(WEAK_CHART_INSPECTOR_COLORS.point)
    const outlierColor = getColor(WEAK_CHART_INSPECTOR_COLORS.outlier)

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
            callbacks: {
              title: (items) => (items[0] ? toInspectorPoint(items[0].raw).record.title : ''),
              label: (item) => {
                const record = toInspectorPoint(item.raw).record
                return `${record.difficulty} / 定数 ${record.const.toFixed(1)} / ${record.score.toLocaleString('ja-JP')}`
              },
            },
          },
        },
        scales: {
          x: {
            min: axisSettings.xMin,
            max: axisSettings.xMax,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: (value) => Number(value).toFixed(1),
            },
          },
          y: {
            min: axisSettings.yMin,
            max: axisSettings.yMax,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              stepSize: WEAK_CHART_SCORE_TICK_INTERVAL,
              callback: (value) => `${Number(value) / WEAK_CHART_SCORE_TICK_INTERVAL}k`,
            },
          },
        },
      },
    })
  })

  onCleanup(() => chart?.destroy())

  return (
    <figure class="rounded-lg border border-border bg-surface p-4">
      <figcaption class="mb-3 flex items-center justify-between gap-2 font-semibold">
        <div class="flex items-center gap-2">
          <ChartNoAxesCombined class="h-5 w-5 text-action-primary" aria-hidden="true" />
          <span>{WEAK_CHART_INSPECTOR_COPY.chartTitle}</span>
        </div>
        <Button
          aria-label="グラフ設定を開く"
          onClick={props.onOpenSettings}
          class="rounded p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          <Settings class="h-5 w-5" aria-hidden="true" />
        </Button>
      </figcaption>
      <div class="overflow-x-auto overscroll-x-contain">
        <div class={`relative h-[28rem] w-full ${WEAK_CHART_MIN_WIDTH_CLASS}`}>
          <canvas ref={canvasRef} aria-label={WEAK_CHART_INSPECTOR_COPY.chartAccessibleLabel} />
        </div>
      </div>
    </figure>
  )
}

/**
 * 外れ値に該当した譜面を表で表示する。
 *
 * @param props.outliers - 外れ値譜面一覧。
 * @returns 外れ値のセマンティックなデータ表。
 */
const OutlierTable = (props: { outliers: WeakChartOutlier[] }): JSX.Element => {
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
   * ソート状態を反映した共通レコード表のヘッダーボタンを生成する。
   *
   * @param label - 列の表示名。
   * @param key - 列のソートキー。
   * @param align - ヘッダー内容の配置。
   * @returns ソート操作可能なヘッダーボタン。
   */
  const header = (label: string, key: WeakChartSortKey, align?: 'start' | 'center') => (
    <RecordHeaderButton
      label={label}
      active={sortKey() === key}
      direction={sortDirection()}
      align={align}
      class={align === 'start' ? 'justify-start !min-h-8' : 'justify-center !min-h-8'}
      onClick={() => handleSortChange(key)}
    />
  )

  return (
    <section class="rounded-lg border border-border bg-surface">
      <h2 class="flex items-center gap-2 border-b border-border px-4 py-3 text-lg font-semibold">
        <TriangleAlert class="h-5 w-5 text-warning" aria-hidden="true" />
        {WEAK_CHART_INSPECTOR_COPY.outlierTitle}
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
          <table class="w-full min-w-[30rem] table-fixed border-collapse text-sm">
            <caption class="sr-only">{WEAK_CHART_INSPECTOR_COPY.tableCaption}</caption>
            <colgroup>
              <col />
              <col class="w-22" />
              <col class="w-12" />
              <col class="w-22" />
            </colgroup>
            <thead class="bg-surface-muted text-left text-text-muted">
              <tr class="[&>*:first-child]:pl-2 [&>*:last-child]:pr-2">
                <th scope="col" class="font-medium">
                  {header('曲名', 'title', 'start')}
                </th>
                <th scope="col" class="font-medium">
                  {header('難易度', 'difficulty')}
                </th>
                <th scope="col" class="font-medium">
                  {header('定数', 'const')}
                </th>
                <th scope="col" class="font-medium">
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
                    <td class="py-1.5 text-center font-jost">{record.const.toFixed(1)}</td>
                    <td class="py-1.5 text-center font-jost">
                      {record.score.toLocaleString('ja-JP')}
                    </td>
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

/**
 * ログイン中ユーザーの苦手譜面分析画面を表示する。
 *
 * @returns 散布図と外れ値表を含むツール画面。
 */
const WeakChartInspectorPage = (): JSX.Element => {
  useDocumentTitle(WEAK_CHART_INSPECTOR_COPY.title)
  const [records] = createResource(async () => {
    const me = await fetchMe()
    return fetchUserRecordWithCache(me.username)
  })
  const analysisRecords = createMemo(() =>
    (records()?.standard ?? []).filter(isWeakChartInspectionTarget)
  )
  const [aggregationSettings, setAggregationSettings] = createSignal<ChartAggregationSettings>({
    ...WEAK_CHART_AGGREGATION_SETTINGS_DEFAULT,
  })
  const [aggregationDifficulties, setAggregationDifficulties] = createSignal<string[]>([
    ...WEAK_CHART_AGGREGATION_DIFFICULTIES_DEFAULT,
  ])
  const aggregationRecords = createMemo(() =>
    analysisRecords().filter(
      (r) =>
        aggregationDifficulties().includes(r.difficulty) &&
        r.score >= aggregationSettings().scoreMin &&
        r.score <= aggregationSettings().scoreMax &&
        r.const >= aggregationSettings().constMin &&
        r.const <= aggregationSettings().constMax
    )
  )
  const displayedRecords = createMemo(() => aggregationRecords().filter(isWeakChartDisplayTarget))
  const inspection = createMemo(() => inspectWeakCharts(aggregationRecords()))
  const lowerOutliers = createMemo(() =>
    inspection().outliers.filter(
      (outlier) => outlier.direction === 'LOW' && isWeakChartDisplayTarget(outlier.record)
    )
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
  const [editAggDifficulties, setEditAggDifficulties] = createSignal<string[]>([
    ...WEAK_CHART_AGGREGATION_DIFFICULTIES_DEFAULT,
  ])

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
        <h1 class="text-2xl font-semibold">{WEAK_CHART_INSPECTOR_COPY.title}</h1>
        <Show when={!records.loading} fallback={<Loading />}>
          <Show
            when={analysisRecords().length > 0}
            fallback={
              <div class="rounded-lg border border-border bg-surface p-8 text-center text-text-muted">
                {WEAK_CHART_INSPECTOR_COPY.emptyRecords}
              </div>
            }
          >
            <WeakChartDistributionChart
              records={displayedRecords()}
              distributions={inspection().distributions}
              outliers={inspection().outliers}
              axisSettings={axisSettings()}
              onOpenSettings={() => openSettings()}
            />
            <OutlierTable outliers={lowerOutliers()} />

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
                    <Button
                      type="button"
                      aria-label={WEAK_CHART_SETTINGS_COPY.reset}
                      class="rounded border border-danger-border bg-danger-bg p-2 text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      onClick={resetSettings}
                    >
                      <RotateCcw class="h-5 w-5" aria-hidden="true" />
                    </Button>
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
                            <For each={WEAK_CHART_AGGREGATION_DIFFICULTIES}>
                              {(diff) => (
                                <Checkbox
                                  checked={editAggDifficulties().includes(diff)}
                                  onChange={(checked) => {
                                    setEditAggDifficulties((prev) =>
                                      checked ? [...prev, diff] : prev.filter((d) => d !== diff)
                                    )
                                  }}
                                  class="relative flex items-center gap-2"
                                >
                                  <Checkbox.Input
                                    id={`agg-difficulty-${diff}`}
                                    style={{ left: '0', top: '0' }}
                                  />
                                  <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse">
                                    <Checkbox.Indicator>
                                      <Check class="h-4 w-4" />
                                    </Checkbox.Indicator>
                                  </Checkbox.Control>
                                  <Checkbox.Label class="leading-5" for={`agg-difficulty-${diff}`}>
                                    {diff}
                                  </Checkbox.Label>
                                </Checkbox>
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
                            <TextField
                              class="block"
                              value={editAggScoreMin()}
                              onChange={setEditAggScoreMin}
                            >
                              <TextField.Input
                                type="number"
                                min={SCORE_MIN}
                                max={SCORE_THEORETICAL_MAX}
                                step="1"
                                class="w-full rounded border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring"
                                aria-label="集計対象 スコア 最小"
                              />
                            </TextField>
                            <div class="flex h-10 items-center justify-center text-lg font-medium leading-none text-text-muted">
                              <span aria-hidden="true">～</span>
                            </div>
                            <TextField
                              class="block"
                              value={editAggScoreMax()}
                              onChange={setEditAggScoreMax}
                            >
                              <TextField.Input
                                type="number"
                                min={SCORE_MIN}
                                max={SCORE_THEORETICAL_MAX}
                                step="1"
                                class="w-full rounded border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring"
                                aria-label="集計対象 スコア 最大"
                              />
                            </TextField>
                          </div>
                        </div>
                        {/* 譜面定数範囲 */}
                        <div class="space-y-1">
                          <span class="block text-sm text-text-muted">
                            {WEAK_CHART_SETTINGS_COPY.constRangeLabel}
                          </span>
                          <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
                            <TextField
                              class="block"
                              value={editAggConstMin()}
                              onChange={setEditAggConstMin}
                            >
                              <TextField.Input
                                type="number"
                                min={CHART_CONST_MIN}
                                max={CHART_CONST_MAX}
                                step="0.1"
                                class="w-full rounded border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring"
                                aria-label="集計対象 譜面定数 最小"
                              />
                            </TextField>
                            <div class="flex h-10 items-center justify-center text-lg font-medium leading-none text-text-muted">
                              <span aria-hidden="true">～</span>
                            </div>
                            <TextField
                              class="block"
                              value={editAggConstMax()}
                              onChange={setEditAggConstMax}
                            >
                              <TextField.Input
                                type="number"
                                min={CHART_CONST_MIN}
                                max={CHART_CONST_MAX}
                                step="0.1"
                                class="w-full rounded border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring"
                                aria-label="集計対象 譜面定数 最大"
                              />
                            </TextField>
                          </div>
                        </div>
                      </div>
                    </fieldset>

                    {/* 表示の絞り込み */}
                    <Collapsible defaultOpen={false}>
                      <Collapsible.Trigger class="group flex w-full items-center justify-start gap-2 text-sm font-semibold text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
                        <ChevronRight
                          class="h-4 w-4 rotate-0 transition-transform group-data-[expanded]:rotate-90"
                          aria-hidden="true"
                        />
                        <span>{WEAK_CHART_SETTINGS_COPY.displaySection}</span>
                      </Collapsible.Trigger>
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
                                <TextField class="block" value={editYMin()} onChange={setEditYMin}>
                                  <TextField.Input
                                    type="number"
                                    min={SCORE_MIN}
                                    max={SCORE_THEORETICAL_MAX}
                                    step="1"
                                    class="w-full rounded border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring"
                                    aria-label="表示の絞り込み スコア 最小"
                                  />
                                </TextField>
                                <div class="flex h-10 items-center justify-center text-lg font-medium leading-none text-text-muted">
                                  <span aria-hidden="true">～</span>
                                </div>
                                <TextField class="block" value={editYMax()} onChange={setEditYMax}>
                                  <TextField.Input
                                    type="number"
                                    min={SCORE_MIN}
                                    max={SCORE_THEORETICAL_MAX}
                                    step="1"
                                    class="w-full rounded border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring"
                                    aria-label="表示の絞り込み スコア 最大"
                                  />
                                </TextField>
                              </div>
                            </div>
                            {/* 譜面定数範囲 */}
                            <div class="space-y-1">
                              <span class="block text-sm text-text-muted">
                                {WEAK_CHART_SETTINGS_COPY.constRangeLabel}
                              </span>
                              <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
                                <TextField class="block" value={editXMin()} onChange={setEditXMin}>
                                  <TextField.Input
                                    type="number"
                                    min={CHART_CONST_MIN}
                                    max={CHART_CONST_MAX}
                                    step="0.1"
                                    class="w-full rounded border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring"
                                    aria-label="表示の絞り込み 譜面定数 最小"
                                  />
                                </TextField>
                                <div class="flex h-10 items-center justify-center text-lg font-medium leading-none text-text-muted">
                                  <span aria-hidden="true">～</span>
                                </div>
                                <TextField class="block" value={editXMax()} onChange={setEditXMax}>
                                  <TextField.Input
                                    type="number"
                                    min={CHART_CONST_MIN}
                                    max={CHART_CONST_MAX}
                                    step="0.1"
                                    class="w-full rounded border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring"
                                    aria-label="表示の絞り込み 譜面定数 最大"
                                  />
                                </TextField>
                              </div>
                            </div>
                          </div>
                        </fieldset>
                      </Collapsible.Content>
                    </Collapsible>
                  </div>

                  <div class="flex justify-end mt-6">
                    <div class="flex gap-2">
                      <Button
                        type="button"
                        class="px-4 py-2 rounded bg-action-secondary text-text-muted hover:bg-action-secondary-hover"
                        onClick={cancelSettings}
                      >
                        {WEAK_CHART_SETTINGS_COPY.cancel}
                      </Button>
                      <Button
                        type="button"
                        class="px-4 py-2 rounded bg-action-primary text-text-inverse hover:bg-action-primary-hover"
                        onClick={applySettings}
                      >
                        {WEAK_CHART_SETTINGS_COPY.apply}
                      </Button>
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
