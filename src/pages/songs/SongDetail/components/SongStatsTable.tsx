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
import { accentPreference, themePreference } from '../../../../stores/themePreferences'
import type { RatingBandDTO, SongStatsBandDTO } from '../../../../types/api'
import { createChartStripePattern } from '../../../../utils/chartPattern'
import {
  CHART_COLOR_FALLBACK,
  resolveChartColor,
  resolveChartPixelLength,
} from '../../../../utils/chartTheme'
import {
  calculateDisplayedScoreDifference,
  formatScoreDifference,
  getScoreDifferenceClass,
} from '../../../../utils/scoreDifference'
import { MAX_SCORE } from '../../../../utils/scoreRank'
import { completeSongStatsRatingBands } from '../../../../utils/songStats'
import { OWN_SCORE_CARD_TITLE } from '../scoreHistory.constants'
import {
  CLEAR_CHART_DATASET_DEFINITIONS,
  COMBO_CHART_DATASET_DEFINITIONS,
  RANK_CHART_DATASET_DEFINITIONS,
  type SongStatsChartStripePatternDefinition,
} from './songStatsChartDefinitions'
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
  stripePattern?: SongStatsChartStripePatternDefinition
}

type SongStatsChartProps = {
  title: string
  ariaLabel: string
  labels: string[]
  datasets: SongStatsChartDataset[]
}

type SongStatsAverageScoreChartProps = {
  labels: string[]
  averageScores: (number | null)[]
  medianScores: (number | null)[]
  ownScore?: number
}

type SongStatsChartsProps = {
  stats: SongStatsBandDTO[]
  ratingBands?: RatingBandDTO[]
  ownScore?: number
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
const CHART_DEFAULT_TEXT_COLOR = '--cs-color-text'
const CHART_DEFAULT_GRID_COLOR = '--cs-color-border'
const CHART_EXCLUDED_RATING_BAND = 'ALL'
const CHART_X_AXIS_TICK_PADDING = 8
/** 平均・中央値グラフのセクション見出し */
const AVERAGE_SCORE_CHART_TITLE = '平均・中央値'
/** 平均スコア系列の凡例・ツールチップ表示名 */
const AVERAGE_SCORE_CHART_LABEL = '平均スコア'
const MEDIAN_SCORE_CHART_LABEL = '中央値スコア'
const AVERAGE_SCORE_CHART_COLOR = '--cs-color-action-primary'
const MEDIAN_SCORE_CHART_BORDER_DASH = [6, 4]
/** 平均・中央値グラフに常時表示するデータ点の半径 */
const AVERAGE_SCORE_CHART_POINT_RADIUS = 2
/** 平均・中央値グラフのデータ点をホバーした際の半径 */
const AVERAGE_SCORE_CHART_POINT_HOVER_RADIUS = 4
/** 自分のスコア参照線の凡例・ツールチップ表示名 */
const OWN_SCORE_CHART_LABEL = OWN_SCORE_CARD_TITLE
/** 自分のスコア参照線の色。アクセント色に依存せず平均・中央値と区別する */
const OWN_SCORE_CHART_COLOR = '--cs-color-text'
/** 平均・中央値グラフのアクセシブル名 */
const AVERAGE_SCORE_CHART_ARIA_LABEL = 'レーティング帯別の平均スコアと中央値スコアの折れ線グラフ'
/** 自分のスコア参照線を含む平均・中央値グラフのアクセシブル名 */
const AVERAGE_SCORE_CHART_WITH_OWN_SCORE_ARIA_LABEL =
  'レーティング帯別の平均スコア、中央値スコア、自分のスコアの折れ線グラフ'
/** 統計テーブルの表示カテゴリ選択肢 */
export const TABLE_VIEW_OPTIONS: SongStatsTableViewOption[] = [
  { label: '平均スコア', value: 'averageScore' },
  { label: 'スコアランク', value: 'scoreRank' },
  { label: 'FC/AJ/AJC', value: 'combo' },
  { label: 'ハードランプ', value: 'clear' },
]
/** ランク別人数を表示する列とAPIレスポンスのキー */
const RANK_STAT_COLUMN_DEFINITIONS = [
  { label: 'MAX', valueKey: 'max' },
  { label: 'SSS+', valueKey: 'sssp' },
  { label: 'SSS', valueKey: 'sss' },
  { label: 'SS+', valueKey: 'ssp' },
  { label: 'SS', valueKey: 'ss' },
  { label: 'S+', valueKey: 'sp' },
  { label: 'S', valueKey: 's' },
  { label: '～AAA', valueKey: 'aaal' },
] as const
const HIGHLIGHTED_RATING_BAND_ROW_CLASS =
  'border-l-4 border-l-action-primary bg-action-primary-muted font-semibold'
const NORMAL_RATING_BAND_ROW_CLASS = 'border-l-4 border-l-transparent'
/** 統計テーブルのヘッダーセルに適用するTailwindクラス */
const TABLE_HEADER_CELL_CLASS =
  'sticky top-0 z-10 bg-surface-muted px-2 py-2 text-right whitespace-nowrap'
/** 統計テーブルの左寄せヘッダーセルに適用するTailwindクラス */
const TABLE_LEFT_HEADER_CELL_CLASS =
  'sticky top-0 z-10 bg-surface-muted px-2 py-2 text-left whitespace-nowrap'
/** 統計テーブルの実力帯セルに適用するTailwindクラス */
const TABLE_RATING_BAND_CELL_CLASS = 'px-2 py-2 text-left'
/** 統計テーブルの通常セルに適用するTailwindクラス */
const TABLE_VALUE_CELL_CLASS = 'px-2 py-2 text-right tabular-nums'
/**
 * 平均スコアを整数部のみの表示文字列へ変換する。
 *
 * @param score 表示するスコア値。
 * @returns 小数点以下を除いた平均スコア文字列。
 */
const formatAverageScore = (score: number): string => Math.trunc(score).toLocaleString()

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
            const difference = calculateDisplayedScoreDifference(ownScore, band.average_score)
            return difference === undefined ? '-' : formatScoreDifference(difference)
          },
          getClass: (band) => {
            const difference = calculateDisplayedScoreDifference(ownScore, band.average_score)
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
 * 対象の棒へ虹色グラデーションまたは斜線背景を適用するChart.jsプラグインを生成する。
 * @param datasets 背景装飾設定を含むグラフデータセット。
 * @returns 棒の描画直前に背景装飾を更新するChart.jsプラグイン。
 */
const createBarBackgroundPlugin = (datasets: SongStatsChartDataset[]): Plugin<'bar'> => {
  const baseColors = datasets.map((dataset) =>
    resolveChartColor(dataset.colorVariable, CHART_COLOR_FALLBACK)
  )
  const gradientColors = datasets.map((dataset) =>
    dataset.gradientColorVariables?.map((variableName) =>
      resolveChartColor(variableName, CHART_COLOR_FALLBACK)
    )
  )
  const stripePatternOptions = datasets.map((dataset, datasetIndex) => {
    const stripePattern = dataset.stripePattern
    if (!stripePattern) return undefined

    return {
      baseColor: baseColors[datasetIndex],
      stripeColor: resolveChartColor(stripePattern.colorVariable, 'rgb(255 255 255 / 25%)'),
      stripeWidth: resolveChartPixelLength(stripePattern.widthVariable, 3),
      period: resolveChartPixelLength(stripePattern.periodVariable, 6),
    }
  })
  let patternWidth = 0
  let patternHeight = 0
  let stripePatterns: (CanvasPattern | string | undefined)[] = []

  return {
    id: 'song-stats-bar-background',
    beforeDatasetsDraw: (chart) => {
      if (patternWidth !== chart.width || patternHeight !== chart.height) {
        patternWidth = chart.width
        patternHeight = chart.height
        stripePatterns = stripePatternOptions.map((options) =>
          options
            ? createChartStripePattern(chart.ctx, chart.width, chart.height, options)
            : undefined
        )
      }

      datasets.forEach((_, datasetIndex) => {
        const colors = gradientColors[datasetIndex]
        const stripePattern = stripePatterns[datasetIndex]
        if (!colors && !stripePattern) return

        const baseColor = baseColors[datasetIndex]

        chart.getDatasetMeta(datasetIndex).data.forEach((element) => {
          const bar = element as BarElement
          const resolvedBackground = colors
            ? createChartGradient(chart.ctx, bar, colors)
            : (stripePattern ?? baseColor)

          bar.options = {
            ...bar.options,
            backgroundColor: resolvedBackground,
            borderColor: resolvedBackground,
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
  const textColor = resolveChartColor(CHART_DEFAULT_TEXT_COLOR, CHART_COLOR_FALLBACK)
  const gridColor = resolveChartColor(CHART_DEFAULT_GRID_COLOR, CHART_COLOR_FALLBACK)

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
    const color = resolveChartColor(dataset.colorVariable, CHART_COLOR_FALLBACK)

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

    themePreference()
    accentPreference()

    const chartData = createSongStatsChartData(props.labels, props.datasets)
    const chartOptions = createSongStatsChartOptions()
    const chartPlugins = [createBarBackgroundPlugin(props.datasets)]

    chart?.destroy()
    chart = new Chart(canvasRef, {
      type: 'bar',
      data: chartData,
      options: chartOptions,
      plugins: chartPlugins,
    })
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
                    background: dataset.stripePattern
                      ? `var(${dataset.stripePattern.legendBackgroundVariable}), var(${dataset.colorVariable})`
                      : `var(${dataset.legendBackgroundVariable ?? dataset.colorVariable})`,
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
  const textColor = resolveChartColor(CHART_DEFAULT_TEXT_COLOR, CHART_COLOR_FALLBACK)
  const gridColor = resolveChartColor(CHART_DEFAULT_GRID_COLOR, CHART_COLOR_FALLBACK)

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
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const score = context.parsed.y
            const label = context.dataset.label ?? AVERAGE_SCORE_CHART_LABEL
            if (score === null) return label
            if (label === OWN_SCORE_CHART_LABEL) {
              return `${label}: ${score.toLocaleString()}`
            }

            return `${label}: ${score.toLocaleString(undefined, {
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
 * rating bandごとの平均スコアと中央値スコアを折れ線グラフで表示する。
 * @param props 横軸ラベル、平均スコア、中央値スコア、自分のスコア。
 * @returns レーティング帯別の平均・中央値スコアグラフ。
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

    themePreference()
    accentPreference()

    const color = resolveChartColor(AVERAGE_SCORE_CHART_COLOR, CHART_COLOR_FALLBACK)
    const ownScore = props.ownScore
    const ownScoreColor = resolveChartColor(OWN_SCORE_CHART_COLOR, CHART_COLOR_FALLBACK)
    const datasets: ChartData<'line', (number | null)[], string>['datasets'] = [
      {
        label: AVERAGE_SCORE_CHART_LABEL,
        data: props.averageScores,
        borderColor: color,
        backgroundColor: color,
        pointBackgroundColor: color,
        pointBorderColor: color,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: color,
        pointRadius: AVERAGE_SCORE_CHART_POINT_RADIUS,
        pointHoverRadius: AVERAGE_SCORE_CHART_POINT_HOVER_RADIUS,
        borderWidth: 2,
        tension: 0.2,
        spanGaps: true,
      },
      {
        label: MEDIAN_SCORE_CHART_LABEL,
        data: props.medianScores,
        borderColor: color,
        backgroundColor: color,
        pointBackgroundColor: color,
        pointBorderColor: color,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: color,
        pointRadius: AVERAGE_SCORE_CHART_POINT_RADIUS,
        pointHoverRadius: AVERAGE_SCORE_CHART_POINT_HOVER_RADIUS,
        borderWidth: 2,
        borderDash: MEDIAN_SCORE_CHART_BORDER_DASH,
        tension: 0.2,
        spanGaps: true,
      },
    ]

    if (ownScore !== undefined) {
      datasets.push({
        label: OWN_SCORE_CHART_LABEL,
        data: props.labels.map(() => ownScore),
        borderColor: ownScoreColor,
        backgroundColor: ownScoreColor,
        pointBackgroundColor: ownScoreColor,
        pointBorderColor: ownScoreColor,
        pointHoverBackgroundColor: ownScoreColor,
        pointHoverBorderColor: ownScoreColor,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 2,
        tension: 0,
      })
    }

    const chartData: ChartData<'line', (number | null)[], string> = {
      labels: props.labels,
      datasets,
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
    chart.options = createAverageScoreChartOptions()
    chart.update('none')
  })

  onCleanup(() => {
    chart?.destroy()
  })

  return (
    <section class="min-w-0 rounded-md border border-border bg-surface-muted p-3">
      <h3 class="mb-2 text-sm font-semibold">{AVERAGE_SCORE_CHART_TITLE}</h3>
      <div class={CHART_HEIGHT_CLASS}>
        <canvas
          ref={canvasRef}
          aria-label={
            props.ownScore === undefined
              ? AVERAGE_SCORE_CHART_ARIA_LABEL
              : AVERAGE_SCORE_CHART_WITH_OWN_SCORE_ARIA_LABEL
          }
          role="img"
        />
      </div>
    </section>
  )
}

/**
 * 難易度別統計テーブルの下に表示する集計グラフを生成する。
 * @param props 表示対象の統計行と、平均・中央値グラフへ重ねる自分のスコア。
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
  const medianScores = createMemo(() => chartStats().map((band) => band.median_score))

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
        ariaLabel="レーティング帯別のNONE、FC、AJ、AJC人数グラフ"
        labels={labels()}
        datasets={comboDatasets()}
      />
      <SongStatsBarChart
        title="HARD"
        ariaLabel="レーティング帯別のハードランプ人数グラフ"
        labels={labels()}
        datasets={clearDatasets()}
      />
      <SongStatsAverageScoreChart
        labels={labels()}
        averageScores={averageScores()}
        medianScores={medianScores()}
        ownScore={props.ownScore}
      />
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
                  <td class={TABLE_RATING_BAND_CELL_CLASS}>{band.rating_band}</td>
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
      <SongStatsCharts
        stats={props.stats}
        ratingBands={props.ratingBands}
        ownScore={props.ownScore}
      />
    </>
  )
}

export default SongStatsTable
