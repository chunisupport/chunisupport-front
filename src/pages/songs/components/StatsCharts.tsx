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
import { createEffect, createSignal, For, onCleanup, onMount } from 'solid-js'
import { ChartCanvasFrame } from '../../../components/common/ChartCanvasFrame'
import { accentPreference, themePreference } from '../../../stores/themePreferences'
import { createChartStripePattern } from '../../../utils/chartPattern'
import {
  CHART_COLOR_FALLBACK,
  resolveChartColor,
  resolveChartPixelLength,
} from '../../../utils/chartTheme'
import { formatScoreKilo } from '../../../utils/numberFormat'
import { MAX_SCORE } from '../../../utils/scoreRank'
import { OWN_SCORE_LABEL } from '../constants'
import {
  LAMP_CHART_GLOSS_COLOR_STOPS,
  LAMP_CHART_GLOSS_OPACITY,
  type StatsChartStripePatternDefinition,
} from './statsChartDefinitions'

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

/** 積み上げ棒グラフの1系列データ */
export type StatsChartDataset = {
  label: string
  values: number[]
  colorVariable: string
  legendBackgroundVariable?: string
  gradientColorVariables?: readonly string[]
  stripePattern?: StatsChartStripePatternDefinition
  gloss?: boolean
}

type StatsBarChartProps = {
  title: string
  ariaLabel: string
  labels: string[]
  datasets: StatsChartDataset[]
  class?: string
}

type StatsAverageScoreChartProps = {
  title?: string
  ariaLabel?: string
  ariaLabelWithOwnScore?: string
  labels: string[]
  averageScores: (number | null)[]
  medianScores: (number | null)[]
  ownScore?: number
  maxScore?: number
  class?: string
}

const CHART_HEIGHT_CLASS = 'h-72'
const CHART_DEFAULT_TEXT_COLOR = '--cs-color-text'
const CHART_DEFAULT_GRID_COLOR = '--cs-color-border'
const CHART_X_AXIS_TICK_PADDING = 8
/** 光沢付きランプの凡例色見本へ重ねるCSSグラデーション変数名 */
const LAMP_GLOSS_GRADIENT_VARIABLE = '--cs-gradient-record-lamp-badge-gloss'
/** 平均・中央値グラフの既定セクション見出し */
const DEFAULT_AVERAGE_SCORE_CHART_TITLE = '平均・中央値'
/** 平均スコア系列の凡例・ツールチップ表示名 */
const AVERAGE_SCORE_CHART_LABEL = '平均'
/** 中央値スコア系列の凡例・ツールチップ表示名 */
const MEDIAN_SCORE_CHART_LABEL = '中央値'
const AVERAGE_SCORE_CHART_COLOR = '--cs-color-action-primary'
const MEDIAN_SCORE_CHART_BORDER_DASH = [6, 4]
/** 平均・中央値グラフに常時表示するデータ点の半径 */
const AVERAGE_SCORE_CHART_POINT_RADIUS = 2
/** 平均・中央値グラフのデータ点をホバーした際の半径 */
const AVERAGE_SCORE_CHART_POINT_HOVER_RADIUS = 4
/** 自分のスコア参照線の凡例・ツールチップ表示名 */
const OWN_SCORE_CHART_LABEL = OWN_SCORE_LABEL
/** 自分のスコア参照線の色。アクセント色に依存せず平均・中央値と区別する */
const OWN_SCORE_CHART_COLOR = '--cs-color-text'
/** 平均・中央値グラフの既定アクセシブル名 */
const DEFAULT_AVERAGE_SCORE_CHART_ARIA_LABEL =
  'レーティング帯別の平均スコアと中央値スコアの折れ線グラフ'
/** 自分のスコア参照線を含む平均・中央値グラフの既定アクセシブル名 */
const DEFAULT_AVERAGE_SCORE_CHART_WITH_OWN_SCORE_ARIA_LABEL =
  'レーティング帯別の平均スコア、中央値スコア、自分のスコアの折れ線グラフ'

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
 * 光沢を指定したデータセットの棒へ、ランプバッジと同じ色の光沢グラデーションを重ねて描画するChart.jsプラグインを生成する。
 * 棒の下地色はChart.jsが描画するため、光沢は半透明のオーバーレイとして描く。
 * 光沢は棒の幅方向へ左から右に1回だけかけ、棒の長さによって引き伸ばされないようにする。
 * 段の高さに関わらず向きを揃え、Chart.jsのグラフでは不透明度を下げて控えめに描く。
 * @param datasets 光沢設定を含むグラフデータセット。
 * @returns データセット描画後に光沢を重ねるChart.jsプラグイン。
 */
const createBarGlossPlugin = (datasets: StatsChartDataset[]): Plugin<'bar'> => {
  const glossColorStops = LAMP_CHART_GLOSS_COLOR_STOPS.map((stop) => ({
    offset: stop.offset,
    color: resolveChartColor(stop.colorVariable, 'transparent'),
  }))

  return {
    id: 'stats-bar-gloss',
    afterDatasetDraw: (chart, { index, meta }) => {
      if (!datasets[index]?.gloss || meta.hidden) return

      const { ctx, chartArea } = chart
      ctx.save()
      ctx.beginPath()
      ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height)
      ctx.clip()
      ctx.globalAlpha = LAMP_CHART_GLOSS_OPACITY

      meta.data.forEach((element) => {
        const { x, y, base, width } = (element as BarElement).getProps(
          ['x', 'y', 'base', 'width'],
          true
        )
        const barWidth = width ?? 0
        const topY = y ?? 0
        const bottomY = base ?? topY
        const barLeft = (x ?? 0) - barWidth / 2
        const barTop = Math.min(topY, bottomY)
        const barHeight = Math.abs(bottomY - topY)
        const gradient = ctx.createLinearGradient(barLeft, 0, barLeft + barWidth, 0)
        glossColorStops.forEach((stop) => {
          gradient.addColorStop(stop.offset, stop.color)
        })

        ctx.fillStyle = gradient
        ctx.fillRect(barLeft, barTop, barWidth, barHeight)
      })

      ctx.restore()
    },
  }
}

/**
 * 対象の棒へ虹色グラデーションまたは斜線背景を適用するChart.jsプラグインを生成する。
 * @param datasets 背景装飾設定を含むグラフデータセット。
 * @returns 棒の描画直前に背景装飾を更新するChart.jsプラグイン。
 */
const createBarBackgroundPlugin = (datasets: StatsChartDataset[]): Plugin<'bar'> => {
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
    id: 'stats-bar-background',
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
          }
        })
      })
    },
  }
}

/**
 * DOM凡例の色見本へ適用する背景を、斜線・光沢・グラデーションの設定に合わせて組み立てる。
 * @param dataset 凡例に表示するデータセット。
 * @returns 色見本のCSS background値。
 */
const getLegendBackground = (dataset: StatsChartDataset): string => {
  if (dataset.stripePattern) {
    return `var(${dataset.stripePattern.legendBackgroundVariable}), var(${dataset.colorVariable})`
  }
  if (dataset.gloss) {
    return `var(${LAMP_GLOSS_GRADIENT_VARIABLE}), var(${dataset.colorVariable})`
  }

  return `var(${dataset.legendBackgroundVariable ?? dataset.colorVariable})`
}

/**
 * Chart.jsの棒グラフ設定を生成する。
 * @returns 統計グラフで共通利用するChart.jsオプション。
 */
const createStatsBarChartOptions = (): ChartOptions<'bar'> => {
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
const createStatsBarChartData = (
  labels: string[],
  datasets: StatsChartDataset[]
): ChartData<'bar', number[], string> => ({
  labels,
  datasets: datasets.map((dataset) => {
    const color = resolveChartColor(dataset.colorVariable, CHART_COLOR_FALLBACK)

    return {
      label: dataset.label,
      data: dataset.values,
      backgroundColor: color,
      hoverBackgroundColor: color,
      borderWidth: 0,
    }
  }),
})

/**
 * 楽曲・コース統計で共通利用する積み上げ棒グラフを描画する。
 * @param props グラフタイトル、アクセシブル名、横軸ラベル、表示データ。
 * @returns 統計積み上げ棒グラフ。
 */
export const StatsBarChart = (props: StatsBarChartProps) => {
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

    const chartData = createStatsBarChartData(props.labels, props.datasets)
    const chartOptions = createStatsBarChartOptions()
    const chartPlugins = [
      createBarBackgroundPlugin(props.datasets),
      createBarGlossPlugin(props.datasets),
    ]

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
    <section
      class={`min-w-0 rounded-md border border-border bg-surface-muted p-3 ${props.class ?? ''}`}
    >
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
                    background: getLegendBackground(dataset),
                  }}
                  aria-hidden="true"
                />
                <span>{dataset.label}</span>
              </li>
            )}
          </For>
        </ul>
        <ChartCanvasFrame class="min-h-0 flex-1">
          <canvas ref={canvasRef} aria-label={props.ariaLabel} role="img" />
        </ChartCanvasFrame>
      </div>
    </section>
  )
}

/**
 * Chart.jsの折れ線グラフ設定を生成する。
 * @param maxScore Y軸の上限スコア。
 * @returns レーティング帯別平均スコアグラフのオプション。
 */
const createAverageScoreChartOptions = (maxScore: number): ChartOptions<'line'> => {
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
        max: maxScore,
        ticks: {
          color: textColor,
          callback: (value) => formatScoreKilo(Number(value)),
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
 * @param props 横軸ラベル、平均スコア、中央値スコア、自分のスコア、Y軸上限スコア。
 * @returns レーティング帯別の平均・中央値スコアグラフ。
 */
export const StatsAverageScoreChart = (props: StatsAverageScoreChartProps) => {
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
    const maxScore = props.maxScore ?? MAX_SCORE
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
        tension: 0,
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
        tension: 0,
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
        options: createAverageScoreChartOptions(maxScore),
      })
      return
    }

    chart.data = chartData
    chart.options = createAverageScoreChartOptions(maxScore)
    chart.update('none')
  })

  onCleanup(() => {
    chart?.destroy()
  })

  return (
    <section
      class={`min-w-0 rounded-md border border-border bg-surface-muted p-3 ${props.class ?? ''}`}
    >
      <h3 class="mb-2 text-sm font-semibold">{props.title ?? DEFAULT_AVERAGE_SCORE_CHART_TITLE}</h3>
      <ChartCanvasFrame class={CHART_HEIGHT_CLASS}>
        <canvas
          ref={canvasRef}
          aria-label={
            props.ownScore === undefined
              ? (props.ariaLabel ?? DEFAULT_AVERAGE_SCORE_CHART_ARIA_LABEL)
              : (props.ariaLabelWithOwnScore ??
                DEFAULT_AVERAGE_SCORE_CHART_WITH_OWN_SCORE_ARIA_LABEL)
          }
          role="img"
        />
      </ChartCanvasFrame>
    </section>
  )
}
