import { A } from '@solidjs/router'
import { Chart, LinearScale, PointElement, ScatterController, Tooltip } from 'chart.js'
import { ChartNoAxesCombined, TriangleAlert } from 'lucide-solid'
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
  SCORE_THEORETICAL_MAX,
  WEAK_CHART_INSPECTOR_DISPLAY_SCORE_MIN,
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
  WEAK_CHART_INSPECTOR_COLORS,
  WEAK_CHART_INSPECTOR_COPY,
  WEAK_CHART_POINT_JITTER,
  WEAK_CHART_SCORE_TICK_INTERVAL,
} from './weakChartInspector.constants'

Chart.register(ScatterController, LinearScale, PointElement, Tooltip)

type InspectorPoint = {
  x: number
  y: number
  record: PlayerRecordDTO
}

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
}): JSX.Element => {
  let canvasRef!: HTMLCanvasElement
  let chart: Chart<'scatter', InspectorPoint[]> | undefined

  createEffect(() => {
    const records = props.records
    const distributions = props.distributions
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
              title: (items) => items[0]?.raw.record.title ?? '',
              label: (item) => {
                const record = item.raw.record
                return `${record.difficulty} / 定数 ${record.const.toFixed(1)} / ${record.score.toLocaleString('ja-JP')}`
              },
            },
          },
        },
        scales: {
          x: {
            min: distributions[0].chartConst - 0.15,
            max: distributions.at(-1)?.chartConst ?? distributions[0].chartConst + 0.15,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: (value) => Number(value).toFixed(1),
            },
            title: { display: true, text: '譜面定数', color: textColor },
          },
          y: {
            min: WEAK_CHART_INSPECTOR_DISPLAY_SCORE_MIN,
            max: SCORE_THEORETICAL_MAX,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              stepSize: WEAK_CHART_SCORE_TICK_INTERVAL,
              callback: (value) => `${Number(value) / WEAK_CHART_SCORE_TICK_INTERVAL}k`,
            },
            title: { display: true, text: '獲得スコア', color: textColor },
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
        {WEAK_CHART_INSPECTOR_COPY.chartTitle}
      </figcaption>
      <div class="h-[28rem] min-w-0">
        <canvas ref={canvasRef} aria-label={WEAK_CHART_INSPECTOR_COPY.chartAccessibleLabel} />
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
              <col class="w-24" />
              <col class="w-16" />
              <col class="w-24" />
            </colgroup>
            <thead class="bg-surface-muted text-left text-text-muted">
              <tr>
                <th scope="col" class="px-2 font-medium">
                  {header('曲名', 'title', 'start')}
                </th>
                <th scope="col" class="px-2 font-medium">
                  {header('難易度', 'difficulty')}
                </th>
                <th scope="col" class="px-2 font-medium">
                  {header('定数', 'const')}
                </th>
                <th scope="col" class="px-2 font-medium">
                  {header('スコア', 'score')}
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={sortedOutliers()}>
                {({ record }) => (
                  <tr class="border-t border-border">
                    <td class="overflow-hidden px-2 py-1.5 font-sans font-medium">
                      <A
                        href={`/songs/${encodeURIComponent(record.id)}`}
                        class="block truncate text-link text-wrap-nowrap hover:text-link-hover hover:underline"
                        title={record.title}
                      >
                        {record.title}
                      </A>
                    </td>
                    <td class="px-2 py-1.5 text-center">
                      <DifficultyBadge difficulty={record.difficulty} compact />
                    </td>
                    <td class="px-2 py-1.5 text-center font-jost">{record.const.toFixed(1)}</td>
                    <td class="px-2 py-1.5 text-center font-jost">
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
  const displayedRecords = createMemo(() => analysisRecords().filter(isWeakChartDisplayTarget))
  const inspection = createMemo(() => inspectWeakCharts(analysisRecords()))
  const lowerOutliers = createMemo(() =>
    inspection().outliers.filter(
      (outlier) => outlier.direction === 'LOW' && isWeakChartDisplayTarget(outlier.record)
    )
  )

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
            />
            <OutlierTable outliers={lowerOutliers()} />
          </Show>
        </Show>
      </main>
    </ErrorBoundary>
  )
}

export default WeakChartInspectorPage
