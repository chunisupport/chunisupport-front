import {
  Chart,
  type ChartData,
  type ChartOptions,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import type { Component } from 'solid-js'
import { createEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { accentPreference, themePreference } from '../../../stores/themePreferences'
import type { PlayerMetricHistoryEntryDTO } from '../../../types/api'
import { CHART_COLOR_FALLBACK, resolveChartColor } from '../../../utils/chartTheme'
import { formatFixed } from '../../../utils/numberFormat'
import {
  buildPlayerMetricHistoryChartPoints,
  formatPlayerMetricHistoryAxisTimestamp,
  formatPlayerMetricHistoryTooltipTimestamp,
  hasPlayerMetricHistoryValues,
  type PlayerMetricHistoryChartPoint,
} from '../../../utils/playerMetricHistory'
import {
  PLAYER_METRIC_HISTORY_BORDER_WIDTH,
  PLAYER_METRIC_HISTORY_CHART_DEFINITIONS,
  PLAYER_METRIC_HISTORY_CHART_HEIGHT_CLASS,
  PLAYER_METRIC_HISTORY_FONT_FAMILY_FALLBACK,
  PLAYER_METRIC_HISTORY_FONT_FAMILY_VARIABLE,
  PLAYER_METRIC_HISTORY_GRID_COLOR_VARIABLE,
  PLAYER_METRIC_HISTORY_LINE_TENSION,
  PLAYER_METRIC_HISTORY_POINT_HIT_RADIUS,
  PLAYER_METRIC_HISTORY_POINT_HOVER_RADIUS,
  PLAYER_METRIC_HISTORY_POINT_RADIUS,
  PLAYER_METRIC_HISTORY_TEXT_COLOR_VARIABLE,
  type PlayerMetricHistoryChartDefinition,
} from './constants'

Chart.register(LineController, LineElement, LinearScale, PointElement, Tooltip)

type Props = {
  /** APIが返した公式指標履歴 */
  entries: readonly PlayerMetricHistoryEntryDTO[]
}

type MetricChartProps = Props & {
  /** 1枚分の指標、表示名、アクセシブル名、テーマ色 */
  definition: PlayerMetricHistoryChartDefinition
}

/**
 * CSSの数値フォントをCanvasへ渡せるフォントファミリー文字列として解決する。
 *
 * @returns 解決済みフォントファミリー。CSS変数が空の場合は代替フォント。
 */
const resolveChartFontFamily = (): string =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(PLAYER_METRIC_HISTORY_FONT_FAMILY_VARIABLE)
    .trim() || PLAYER_METRIC_HISTORY_FONT_FAMILY_FALLBACK

/**
 * 公式指標履歴の折れ線グラフ設定を生成する。
 *
 * @param definition - 表示対象指標の定義。
 * @returns テーマ色、指標ごとの小数桁と単位を反映したChart.js設定。
 */
const createMetricChartOptions = (
  definition: PlayerMetricHistoryChartDefinition
): ChartOptions<'line'> => {
  const textColor = resolveChartColor(
    PLAYER_METRIC_HISTORY_TEXT_COLOR_VARIABLE,
    CHART_COLOR_FALLBACK
  )
  const gridColor = resolveChartColor(
    PLAYER_METRIC_HISTORY_GRID_COLOR_VARIABLE,
    CHART_COLOR_FALLBACK
  )
  const fontFamily = resolveChartFontFamily()

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    parsing: false,
    normalized: true,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        titleFont: { family: fontFamily },
        bodyFont: { family: fontFamily },
        callbacks: {
          title: (items) => {
            const timestamp = items[0]?.parsed.x
            return typeof timestamp === 'number'
              ? formatPlayerMetricHistoryTooltipTimestamp(timestamp)
              : ''
          },
          label: (context) => {
            const value = context.parsed.y
            return value === null
              ? definition.title
              : `${definition.title}: ${formatFixed(value, definition.decimalPlaces)}${definition.suffix}`
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        ticks: {
          autoSkip: true,
          color: textColor,
          font: { family: fontFamily },
          maxRotation: 0,
          callback: (value) => formatPlayerMetricHistoryAxisTimestamp(Number(value)),
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: textColor,
          font: { family: fontFamily },
          callback: (value) =>
            `${formatFixed(Number(value), definition.decimalPlaces)}${definition.suffix}`,
        },
        grid: {
          color: gridColor,
        },
      },
    },
  }
}

/**
 * 公式RATING、公式OVER POWER、公式OP%のうち1系列を折れ線グラフで表示する。
 *
 * @param props - 公式指標履歴と1枚分の表示定義。
 * @returns テーマと表示幅へ追従するChart.js折れ線グラフ。
 */
const MetricHistoryLineChart: Component<MetricChartProps> = (props) => {
  let canvasRef!: HTMLCanvasElement
  let chart: Chart<'line', PlayerMetricHistoryChartPoint[], number> | undefined
  const [mounted, setMounted] = createSignal(false)

  onMount(() => {
    setMounted(true)
  })

  createEffect(() => {
    if (!mounted()) return

    themePreference()
    accentPreference()

    const definition = props.definition
    const points = buildPlayerMetricHistoryChartPoints(props.entries, definition.metric)
    const color = resolveChartColor(definition.colorVariable, CHART_COLOR_FALLBACK)
    const chartData: ChartData<'line', PlayerMetricHistoryChartPoint[], number> = {
      datasets: [
        {
          label: definition.title,
          data: points,
          borderColor: color,
          backgroundColor: color,
          pointBackgroundColor: color,
          pointBorderColor: color,
          pointHoverBackgroundColor: color,
          pointHoverBorderColor: color,
          pointRadius: PLAYER_METRIC_HISTORY_POINT_RADIUS,
          pointHoverRadius: PLAYER_METRIC_HISTORY_POINT_HOVER_RADIUS,
          pointHitRadius: PLAYER_METRIC_HISTORY_POINT_HIT_RADIUS,
          borderWidth: PLAYER_METRIC_HISTORY_BORDER_WIDTH,
          tension: PLAYER_METRIC_HISTORY_LINE_TENSION,
          spanGaps: false,
        },
      ],
    }

    if (!chart) {
      chart = new Chart(canvasRef, {
        type: 'line',
        data: chartData,
        options: createMetricChartOptions(definition),
      })
      return
    }

    chart.data = chartData
    chart.options = createMetricChartOptions(definition)
    chart.update('none')
  })

  onCleanup(() => {
    chart?.destroy()
  })

  return (
    <section class="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <h2 class="mb-3 text-lg font-semibold text-text">{props.definition.title}</h2>
      <div class={PLAYER_METRIC_HISTORY_CHART_HEIGHT_CLASS}>
        <canvas ref={canvasRef} aria-label={props.definition.ariaLabel} role="img" />
      </div>
    </section>
  )
}

/**
 * 公式RATING・公式OVER POWER・記録済みの公式OP%を縦積みグラフで表示する。
 *
 * @param props - APIが返した公式指標履歴。
 * @returns 単位の異なる指標を分離し、全件未記録のOP%を除外した折れ線グラフ。
 */
export const RatingOpHistoryChart: Component<Props> = (props) => (
  <div class="space-y-4">
    <For each={PLAYER_METRIC_HISTORY_CHART_DEFINITIONS}>
      {(definition) => (
        <Show
          when={
            definition.metric !== 'overpower_percent' ||
            hasPlayerMetricHistoryValues(props.entries, definition.metric)
          }
        >
          <MetricHistoryLineChart entries={props.entries} definition={definition} />
        </Show>
      )}
    </For>
  </div>
)
