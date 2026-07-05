import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  type ChartData,
  type ChartOptions,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  type Plugin,
  PointElement,
  Tooltip,
} from 'chart.js'
import { createEffect, createMemo, createSignal, For, onCleanup, onMount } from 'solid-js'
import type { RatingBandDTO, SongStatsBandDTO } from '../../../../types/api'
import { MAX_SCORE } from '../../../../utils/scoreRank'
import {
  calculateOwnScoreDifference,
  completeSongStatsRatingBands,
} from '../../../../utils/songStats'
import { isOwnBestAverageRatingBand } from './songStatsHighlight'

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
)

type Props = {
  stats: SongStatsBandDTO[]
  selectedView: SongStatsTableView
  bestAverage?: number | null
  ratingBands?: RatingBandDTO[]
  ownScore?: number
}

type SongStatsChartDataset = {
  label: string
  values: number[]
  colorVariable: string
  legendBackgroundVariable?: string
  gradientColorVariables?: readonly string[]
}

type SongStatsChartProps = {
  title: string
  ariaLabel: string
  labels: string[]
  datasets: SongStatsChartDataset[]
}

type SongStatsAverageScoreChartProps = {
  labels: string[]
  values: (number | null)[]
}

type SongStatsChartsProps = {
  stats: SongStatsBandDTO[]
  ratingBands?: RatingBandDTO[]
}

export type SongStatsTableView = 'averageScore' | 'scoreRank' | 'combo' | 'clear'

export type SongStatsTableViewOption = {
  label: string
  value: SongStatsTableView
}

type SongStatsTableColumnDefinition = {
  label: string
  getValue: (band: SongStatsBandDTO) => number | string
  getClass?: (band: SongStatsBandDTO) => string | undefined
}

const CHART_HEIGHT_CLASS = 'h-72'
const CHART_COLOR_FALLBACK = '#6b7280'
const CHART_DEFAULT_TEXT_COLOR = '--cs-color-text'
const CHART_DEFAULT_GRID_COLOR = '--cs-color-border'
const CHART_EXCLUDED_RATING_BAND = 'ALL'
const CHART_X_AXIS_TICK_PADDING = 8
const AVERAGE_SCORE_CHART_TITLE = 'AVG. SCORE'
const AVERAGE_SCORE_CHART_COLOR = '--cs-color-action-primary'
/** 統計テーブルの表示カテゴリ選択肢。 */
export const TABLE_VIEW_OPTIONS: SongStatsTableViewOption[] = [
  { label: '平均スコア', value: 'averageScore' },
  { label: 'スコアランク', value: 'scoreRank' },
  { label: 'FC/AJ/AJC', value: 'combo' },
  { label: 'ハードランプ', value: 'clear' },
]
/** ランク別人数を表示する列とAPIレスポンスのキー。 */
const RANK_STAT_COLUMN_DEFINITIONS = [
  { label: 'MAX', valueKey: 'max' },
  { label: 'SSS+', valueKey: 'sssp' },
  { label: 'SSS', valueKey: 'sss' },
  { label: 'SS+', valueKey: 'ssp' },
  { label: 'SS', valueKey: 'ss' },
  { label: 'S+', valueKey: 'sp' },
  { label: 'S', valueKey: 's' },
  { label: 'AAA以下', valueKey: 'aaal' },
] as const
/** RANK積み上げ棒グラフへ表示するデータセット定義。 */
const RANK_CHART_DATASET_DEFINITIONS = [
  { label: 'AAA以下', valueKey: 'aaal', colorVariable: '--cs-color-score-rank-d-bg' },
  { label: 'S', valueKey: 's', colorVariable: '--cs-color-score-rank-a-bg' },
  { label: 'S+', valueKey: 'sp', colorVariable: '--cs-color-score-rank-a-bg' },
  { label: 'SS', valueKey: 'ss', colorVariable: '--cs-color-score-rank-ss-bg' },
  { label: 'SS+', valueKey: 'ssp', colorVariable: '--cs-color-score-rank-ss-bg' },
  { label: 'SSS', valueKey: 'sss', colorVariable: '--cs-color-score-rank-sss-bg' },
  { label: 'SSS+', valueKey: 'sssp', colorVariable: '--cs-color-score-rank-sssp-bg' },
  { label: 'MAX', valueKey: 'max', colorVariable: '--cs-color-success' },
] as const
const HIGHLIGHTED_RATING_BAND_ROW_CLASS =
  'border-l-4 border-l-action-primary bg-action-primary-muted font-semibold'
const NORMAL_RATING_BAND_ROW_CLASS = 'border-l-4 border-l-transparent'
const POSITIVE_SCORE_DIFFERENCE_CLASS = 'text-success'
const NEGATIVE_SCORE_DIFFERENCE_CLASS = 'text-info'
const EQUAL_SCORE_DIFFERENCE_CLASS = 'text-text-muted'
/** 統計テーブルのヘッダーセルに適用するTailwindクラス。 */
const TABLE_HEADER_CELL_CLASS =
  'sticky top-0 z-10 bg-surface-muted px-2 py-2 text-right whitespace-nowrap'
/** 統計テーブルの左寄せヘッダーセルに適用するTailwindクラス。 */
const TABLE_LEFT_HEADER_CELL_CLASS =
  'sticky top-0 z-10 bg-surface-muted px-2 py-2 text-left whitespace-nowrap'
/** 統計テーブルの通常セルに適用するTailwindクラス。 */
const TABLE_VALUE_CELL_CLASS = 'px-2 py-2 text-right tabular-nums'
const COMBO_CHART_DATASET_DEFINITIONS = [
  { label: 'FC', valueKey: 'fc', colorVariable: '--cs-color-lamp-full-combo-bg' },
  { label: 'AJ', valueKey: 'aj', colorVariable: '--cs-color-lamp-all-justice-bg' },
  {
    label: 'AJC',
    valueKey: 'ajc',
    colorVariable: '--cs-color-lamp-all-justice-critical-bg',
    legendBackgroundVariable: '--cs-gradient-lamp-all-justice-critical-bg',
    gradientColorVariables: [
      '--cs-color-lamp-all-justice-critical-rainbow-1',
      '--cs-color-lamp-all-justice-critical-rainbow-2',
      '--cs-color-lamp-all-justice-critical-rainbow-3',
      '--cs-color-lamp-all-justice-critical-rainbow-4',
      '--cs-color-lamp-all-justice-critical-rainbow-5',
      '--cs-color-lamp-all-justice-critical-rainbow-6',
      '--cs-color-lamp-all-justice-critical-rainbow-7',
    ],
  },
] as const
const CLEAR_CHART_DATASET_DEFINITIONS = [
  { label: 'CLEAR', valueKey: 'clear', colorVariable: '--cs-color-lamp-clear-bg' },
  { label: 'HARD', valueKey: 'hard', colorVariable: '--cs-color-lamp-hard-bg' },
  { label: 'BRAVE', valueKey: 'brave', colorVariable: '--cs-color-lamp-brave-bg' },
  { label: 'ABSOLUTE', valueKey: 'absolute', colorVariable: '--cs-color-lamp-absolute-bg' },
  {
    label: 'CATASTROPHY',
    valueKey: 'catastrophy',
    colorVariable: '--cs-color-lamp-catastrophy-bg',
  },
] as const

/**
 * 平均スコアを整数部のみの表示文字列へ変換する。
 *
 * @param score 表示するスコア値。
 * @returns 小数点以下を除いた平均スコア文字列。
 */
const formatAverageScore = (score: number): string => Math.trunc(score).toLocaleString()

/**
 * 平均スコアとの差分を符号付きの整数表示へ変換する。
 *
 * @param difference - 自分のスコアから平均スコアを引いた差分。
 * @returns 小数点以下を除いた差分文字列。
 */
const formatScoreDifference = (difference: number): string =>
  Math.trunc(difference).toLocaleString(undefined, {
    signDisplay: 'always',
  })

/**
 * 平均スコアとの差分に応じた文字色クラスを返す。
 *
 * @param difference - 自分のスコアから平均スコアを引いた差分。
 * @returns 正数は緑、負数は青、同値は補助テキスト色のクラス。
 */
const getScoreDifferenceClass = (difference: number): string => {
  if (difference > 0) return POSITIVE_SCORE_DIFFERENCE_CLASS
  if (difference < 0) return NEGATIVE_SCORE_DIFFERENCE_CLASS
  return EQUAL_SCORE_DIFFERENCE_CLASS
}

/**
 * 統計表に表示する列定義をカテゴリごとに取得する。
 *
 * @param view 表示対象の統計カテゴリ。
 * @param ownScore 平均スコアとの差分表示に利用する自分のスコア。
 * @returns 共通列の右側に表示する列定義。
 */
const getTableColumnDefinitions = (
  view: SongStatsTableView,
  ownScore: number | undefined
): SongStatsTableColumnDefinition[] => {
  switch (view) {
    case 'averageScore':
      return [
        {
          label: '人数',
          getValue: (band) => band.player_count.toLocaleString(),
        },
        {
          label: '平均スコア',
          getValue: (band) =>
            band.average_score === null ? '-' : formatAverageScore(band.average_score),
        },
        {
          label: '自分との差',
          getValue: (band) => {
            const difference = calculateOwnScoreDifference(ownScore, band.average_score)
            return difference === undefined ? '-' : formatScoreDifference(difference)
          },
          getClass: (band) => {
            const difference = calculateOwnScoreDifference(ownScore, band.average_score)
            return difference === undefined ? undefined : getScoreDifferenceClass(difference)
          },
        },
      ]
    case 'scoreRank':
      return RANK_STAT_COLUMN_DEFINITIONS.map((column) => ({
        label: column.label,
        getValue: (band: SongStatsBandDTO) => band.rank[column.valueKey].toLocaleString(),
      }))
    case 'combo':
      return [
        { label: 'FC', getValue: (band) => band.combo.fc.toLocaleString() },
        { label: 'AJ', getValue: (band) => band.combo.aj.toLocaleString() },
        { label: 'AJC', getValue: (band) => band.combo.ajc.toLocaleString() },
      ]
    case 'clear':
      return [
        { label: 'CLEAR', getValue: (band) => band.clear.clear.toLocaleString() },
        { label: 'HARD', getValue: (band) => band.clear.hard.toLocaleString() },
        { label: 'BRAVE', getValue: (band) => band.clear.brave.toLocaleString() },
        { label: 'ABSOLUTE', getValue: (band) => band.clear.absolute.toLocaleString() },
        {
          label: 'CATASTROPHY',
          getValue: (band) => band.clear.catastrophy.toLocaleString(),
        },
      ]
  }
}

/**
 * CSSカスタムプロパティからChart.jsへ渡す解決済みの色値を取得する。
 * @param variableName 取得対象のCSSカスタムプロパティ名。
 * @returns Chart.jsで利用するCSS色値。
 */
const getChartColor = (variableName: string): string => {
  const colorProbe = document.createElement('span')
  colorProbe.style.color = `var(${variableName}, ${CHART_COLOR_FALLBACK})`
  document.documentElement.append(colorProbe)

  const color = getComputedStyle(colorProbe).color || CHART_COLOR_FALLBACK
  colorProbe.remove()

  return color
}

/**
 * 棒の左上から右下へ向かうCanvasグラデーションを生成する。
 * @param context グラデーションを生成するCanvasコンテキスト。
 * @param bar グラデーションの描画範囲に利用する棒要素。
 * @param colors グラデーションを構成する解決済みの色。
 * @returns 棒の描画範囲に合わせたCanvasグラデーション。
 */
const createChartGradient = (
  context: CanvasRenderingContext2D,
  bar: BarElement,
  colors: readonly string[]
): CanvasGradient => {
  const { x, y, base, width } = bar.getProps(['x', 'y', 'base', 'width'], true)
  const centerX = x ?? 0
  const topY = y ?? 0
  const bottomY = base ?? topY
  const barWidth = width ?? 0
  const gradient = context.createLinearGradient(
    centerX - barWidth / 2,
    topY,
    centerX + barWidth / 2,
    bottomY
  )
  const lastColorIndex = colors.length - 1

  colors.forEach((color, index) => {
    gradient.addColorStop(index / lastColorIndex, color)
  })

  return gradient
}

/**
 * グラデーション対象の各棒へ個別の虹色背景を適用するChart.jsプラグインを生成する。
 * @param datasets グラデーション設定を含むグラフデータセット。
 * @returns 棒の描画直前にグラデーションを更新するChart.jsプラグイン。
 */
const createBarGradientPlugin = (datasets: SongStatsChartDataset[]): Plugin<'bar'> => {
  const gradientColors = datasets.map((dataset) =>
    dataset.gradientColorVariables?.map(getChartColor)
  )

  return {
    id: 'song-stats-bar-gradient',
    beforeDatasetsDraw: (chart) => {
      gradientColors.forEach((colors, datasetIndex) => {
        if (!colors) return

        chart.getDatasetMeta(datasetIndex).data.forEach((element) => {
          const bar = element as BarElement
          const backgroundColor = createChartGradient(chart.ctx, bar, colors)

          bar.options = {
            ...bar.options,
            backgroundColor,
            borderColor: backgroundColor,
          }
        })
      })
    },
  }
}

/**
 * Chart.jsの棒グラフ設定を生成する。
 * @returns 統計グラフで共通利用するChart.jsオプション。
 */
const createSongStatsChartOptions = (): ChartOptions<'bar'> => {
  const textColor = getChartColor(CHART_DEFAULT_TEXT_COLOR)
  const gridColor = getChartColor(CHART_DEFAULT_GRID_COLOR)

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false,
        labels: {
          color: textColor,
          boxWidth: 12,
          boxHeight: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y?.toLocaleString()}人`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: textColor,
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: CHART_X_AXIS_TICK_PADDING,
        },
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          color: textColor,
          precision: 0,
        },
        grid: {
          color: gridColor,
        },
      },
    },
  }
}

/**
 * 表示データをChart.jsの棒グラフデータへ変換する。
 * @param labels 横軸に表示するレーティング帯。
 * @param datasets グラフへ表示するランプ別データ。
 * @returns Chart.jsに渡すデータセット。
 */
const createSongStatsChartData = (
  labels: string[],
  datasets: SongStatsChartDataset[]
): ChartData<'bar', number[], string> => ({
  labels,
  datasets: datasets.map((dataset) => {
    const color = getChartColor(dataset.colorVariable)

    return {
      label: dataset.label,
      data: dataset.values,
      backgroundColor: color,
      borderColor: color,
      hoverBackgroundColor: color,
      hoverBorderColor: color,
      borderWidth: 1,
      borderRadius: 3,
    }
  }),
})

/**
 * 積み上げグラフに表示する統計行を取得する。
 * @param stats APIから取得したレーティング帯別統計行。
 * @returns ALL行を除いたグラフ表示用の統計行。
 */
const getChartStats = (stats: SongStatsBandDTO[]): SongStatsBandDTO[] =>
  stats.filter((band) => band.rating_band !== CHART_EXCLUDED_RATING_BAND)

/**
 * Chart.jsをSolidJSのライフサイクルに合わせて描画する。
 * @param props グラフタイトル、アクセシブル名、横軸ラベル、表示データ。
 * @returns 楽曲統計グラフ。
 */
const SongStatsBarChart = (props: SongStatsChartProps) => {
  let canvasRef!: HTMLCanvasElement
  let chart: Chart<'bar', number[], string> | undefined
  const [mounted, setMounted] = createSignal(false)

  onMount(() => {
    setMounted(true)
  })

  createEffect(() => {
    if (!mounted()) return

    const chartData = createSongStatsChartData(props.labels, props.datasets)

    if (!chart) {
      chart = new Chart(canvasRef, {
        type: 'bar',
        data: chartData,
        options: createSongStatsChartOptions(),
        plugins: [createBarGradientPlugin(props.datasets)],
      })
      return
    }

    chart.data = chartData
    chart.update('none')
  })

  onCleanup(() => {
    chart?.destroy()
  })

  return (
    <section class="min-w-0 rounded-md border border-border bg-surface-muted p-3">
      <h3 class="mb-2 text-sm font-semibold">{props.title}</h3>
      <div class={`${CHART_HEIGHT_CLASS} flex flex-col`}>
        <ul
          class="mb-1 flex shrink-0 flex-wrap justify-center gap-x-3 gap-y-1 text-xs"
          aria-label={`${props.title}凡例`}
        >
          <For each={props.datasets}>
            {(dataset) => (
              <li class="flex shrink-0 items-center gap-1 whitespace-nowrap">
                <span
                  class="size-3"
                  style={{
                    background: `var(${dataset.legendBackgroundVariable ?? dataset.colorVariable})`,
                  }}
                  aria-hidden="true"
                />
                <span>{dataset.label}</span>
              </li>
            )}
          </For>
        </ul>
        <div class="min-h-0 flex-1">
          <canvas ref={canvasRef} aria-label={props.ariaLabel} role="img" />
        </div>
      </div>
    </section>
  )
}

/**
 * Chart.jsの折れ線グラフ設定を生成する。
 * @returns レーティング帯別平均スコアグラフのオプション。
 */
const createAverageScoreChartOptions = (): ChartOptions<'line'> => {
  const textColor = getChartColor(CHART_DEFAULT_TEXT_COLOR)
  const gridColor = getChartColor(CHART_DEFAULT_GRID_COLOR)

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const score = context.parsed.y
            if (score === null) return AVERAGE_SCORE_CHART_TITLE

            return `${AVERAGE_SCORE_CHART_TITLE}: ${score.toLocaleString(undefined, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}`
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: textColor,
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: CHART_X_AXIS_TICK_PADDING,
        },
        grid: {
          display: false,
        },
      },
      y: {
        max: MAX_SCORE,
        ticks: {
          color: textColor,
          callback: (value) => Number(value).toLocaleString(),
        },
        grid: {
          color: gridColor,
        },
      },
    },
  }
}

/**
 * rating bandごとの平均スコアを折れ線グラフで表示する。
 * @param props 横軸ラベルと平均スコア。
 * @returns レーティング帯別平均スコアグラフ。
 */
const SongStatsAverageScoreChart = (props: SongStatsAverageScoreChartProps) => {
  let canvasRef!: HTMLCanvasElement
  let chart: Chart<'line', (number | null)[], string> | undefined
  const [mounted, setMounted] = createSignal(false)

  onMount(() => {
    setMounted(true)
  })

  createEffect(() => {
    if (!mounted()) return

    const color = getChartColor(AVERAGE_SCORE_CHART_COLOR)
    const chartData: ChartData<'line', (number | null)[], string> = {
      labels: props.labels,
      datasets: [
        {
          label: AVERAGE_SCORE_CHART_TITLE,
          data: props.values,
          borderColor: color,
          backgroundColor: color,
          pointBackgroundColor: color,
          pointBorderColor: color,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0.2,
          spanGaps: true,
        },
      ],
    }

    if (!chart) {
      chart = new Chart(canvasRef, {
        type: 'line',
        data: chartData,
        options: createAverageScoreChartOptions(),
      })
      return
    }

    chart.data = chartData
    chart.update('none')
  })

  onCleanup(() => {
    chart?.destroy()
  })

  return (
    <section class="min-w-0 rounded-md border border-border bg-surface-muted p-3">
      <h3 class="mb-2 text-sm font-semibold">{AVERAGE_SCORE_CHART_TITLE}</h3>
      <div class={CHART_HEIGHT_CLASS}>
        <canvas ref={canvasRef} aria-label="レーティング帯別の平均スコア折れ線グラフ" role="img" />
      </div>
    </section>
  )
}

/**
 * 難易度別統計テーブルの下に表示する集計グラフを生成する。
 * @param props 表示対象の統計行。
 * @returns RANK、FC/AJ/AJC、CLEAR系ランプ、平均スコアのグラフ。
 */
const SongStatsCharts = (props: SongStatsChartsProps) => {
  const chartStats = createMemo(() => {
    const stats = getChartStats(props.stats)
    const ratingBands = props.ratingBands

    return ratingBands
      ? completeSongStatsRatingBands(
          stats,
          ratingBands.filter((band) => band.label !== CHART_EXCLUDED_RATING_BAND)
        )
      : stats
  })
  const labels = createMemo(() => chartStats().map((band) => band.rating_band))
  const rankDatasets = createMemo<SongStatsChartDataset[]>(() =>
    RANK_CHART_DATASET_DEFINITIONS.map((definition) => ({
      ...definition,
      values: chartStats().map((band) => band.rank[definition.valueKey]),
    }))
  )
  const comboDatasets = createMemo<SongStatsChartDataset[]>(() =>
    COMBO_CHART_DATASET_DEFINITIONS.map((definition) => ({
      ...definition,
      values: chartStats().map((band) => band.combo[definition.valueKey]),
    }))
  )
  const clearDatasets = createMemo<SongStatsChartDataset[]>(() =>
    CLEAR_CHART_DATASET_DEFINITIONS.map((definition) => ({
      ...definition,
      values: chartStats().map((band) => band.clear[definition.valueKey]),
    }))
  )
  const averageScores = createMemo(() => chartStats().map((band) => band.average_score))

  return (
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <SongStatsBarChart
        title="RANK"
        ariaLabel="レーティング帯別のスコアランク人数グラフ"
        labels={labels()}
        datasets={rankDatasets()}
      />
      <SongStatsBarChart
        title="COMBO"
        ariaLabel="レーティング帯別のFC、AJ、AJC人数グラフ"
        labels={labels()}
        datasets={comboDatasets()}
      />
      <SongStatsBarChart
        title="HARD"
        ariaLabel="レーティング帯別のハードランプ人数グラフ"
        labels={labels()}
        datasets={clearDatasets()}
      />
      <SongStatsAverageScoreChart labels={labels()} values={averageScores()} />
    </div>
  )
}

/**
 * 楽曲詳細ページのレーティング帯別統計を表とグラフで表示する。
 * @param props 表示する統計行。
 * @returns 難易度別統計テーブルと集計グラフ。
 */
const SongStatsTable = (props: Props) => {
  const displayedColumns = createMemo(() =>
    getTableColumnDefinitions(props.selectedView, props.ownScore)
  )

  /**
   * 統計行に適用するハイライト状態を含むクラスを返す。
   *
   * @param ratingBandLabel 判定対象のレーティング帯ラベル。
   * @returns ハイライト有無に応じたテーブル行クラス。
   */
  const getRowClass = (ratingBandLabel: string): string =>
    `border-t border-border ${
      isOwnBestAverageRatingBand(ratingBandLabel, props.bestAverage, props.ratingBands)
        ? HIGHLIGHTED_RATING_BAND_ROW_CLASS
        : NORMAL_RATING_BAND_ROW_CLASS
    }`

  return (
    <>
      <div class="max-h-[75vh] overflow-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr>
              <th class={TABLE_LEFT_HEADER_CELL_CLASS}>実力帯</th>
              <For each={displayedColumns()}>
                {(column) => <th class={TABLE_HEADER_CELL_CLASS}>{column.label}</th>}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={props.stats}>
              {(band) => (
                <tr class={getRowClass(band.rating_band)}>
                  <td class="px-2 py-2">{band.rating_band}</td>
                  <For each={displayedColumns()}>
                    {(column) => (
                      <td class={`${TABLE_VALUE_CELL_CLASS} ${column.getClass?.(band) ?? ''}`}>
                        {column.getValue(band)}
                      </td>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
      <SongStatsCharts stats={props.stats} ratingBands={props.ratingBands} />
    </>
  )
}

export default SongStatsTable
