import {
  Chart,
  type ChartData,
  type ChartOptions,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { accentPreference, themePreference } from '../../../../stores/themePreferences'
import type { ScoreHistoryEntryDTO } from '../../../../types/api'
import { CHART_COLOR_FALLBACK, resolveChartColor } from '../../../../utils/chartTheme'
import { formatScoreKilo } from '../../../../utils/numberFormat'
import { formatScoreHistoryTimestamp } from '../../../../utils/scoreHistory'
import { MAX_SCORE } from '../../../../utils/scoreRank'
import { SCORE_HISTORY_EMPTY_LABEL, SCORE_HISTORY_SCORE_LABEL } from './constants'

Chart.register(Legend, LineController, LineElement, LinearScale, PointElement, Tooltip)

type Props = {
  /** 表示対象のスコア履歴。 */
  entries: readonly ScoreHistoryEntryDTO[]
}

type ScoreHistoryChartPoint = {
  x: number
  y: number
}

const CHART_HEIGHT_CLASS = 'h-80'
const CHART_LINE_COLOR_VARIABLE = '--cs-color-action-primary'
const CHART_TEXT_COLOR_VARIABLE = '--cs-color-text'
const CHART_GRID_COLOR_VARIABLE = '--cs-color-border'
const CHART_MIN_PADDING = 5_000
const CHART_MIN_STEP = 1_000
const SCORE_HISTORY_TICK_INTERVAL = 1_000
const CHART_POINT_RADIUS = 3
const CHART_POINT_HOVER_RADIUS = 5
const CHART_BORDER_WIDTH = 2
const CHART_TENSION = 0.2

/**
 * スコア履歴を横軸日時の昇順へ並べ替える。
 *
 * @param entries - APIが返したスコア履歴。
 * @returns 日時昇順のスコア履歴。
 */
const sortEntriesByUpdatedAt = (entries: readonly ScoreHistoryEntryDTO[]): ScoreHistoryEntryDTO[] =>
  [...entries].sort((left, right) => {
    const leftTime = new Date(left.updated_at).getTime()
    const rightTime = new Date(right.updated_at).getTime()
    return leftTime - rightTime
  })

/**
 * スコア推移グラフの下限値を算出する。
 *
 * @param entries - 表示対象のスコア履歴。
 * @returns 目盛りに合わせたスコア下限。
 */
const getScoreAxisMin = (entries: readonly ScoreHistoryEntryDTO[]): number => {
  const minScore = Math.min(...entries.map((entry) => entry.score))
  return Math.max(0, Math.floor((minScore - CHART_MIN_PADDING) / CHART_MIN_STEP) * CHART_MIN_STEP)
}

/**
 * スコア推移グラフのChart.js設定を生成する。
 *
 * @param entries - 表示対象のスコア履歴。
 * @returns 折れ線グラフ設定。
 */
const createScoreHistoryChartOptions = (
  entries: readonly ScoreHistoryEntryDTO[]
): ChartOptions<'line'> => {
  const textColor = resolveChartColor(CHART_TEXT_COLOR_VARIABLE, CHART_COLOR_FALLBACK)
  const gridColor = resolveChartColor(CHART_GRID_COLOR_VARIABLE, CHART_COLOR_FALLBACK)

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
          title: (items) => {
            const timestamp = items[0]?.parsed.x
            return typeof timestamp !== 'number' ? '' : formatScoreHistoryTimestamp(timestamp)
          },
          label: (context) => {
            const score = context.parsed.y
            return score === null
              ? SCORE_HISTORY_SCORE_LABEL
              : `${SCORE_HISTORY_SCORE_LABEL}: ${score.toLocaleString('ja-JP')}`
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        ticks: {
          color: textColor,
          maxRotation: 0,
          autoSkip: true,
          callback: (value) => formatScoreHistoryTimestamp(Number(value)),
        },
        grid: {
          display: false,
        },
      },
      y: {
        min: getScoreAxisMin(entries),
        max: MAX_SCORE,
        ticks: {
          color: textColor,
          stepSize: SCORE_HISTORY_TICK_INTERVAL,
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
 * スコア履歴を縦軸スコア、横軸日時の折れ線グラフで表示する。
 *
 * @param props - 表示対象のスコア履歴。
 * @returns スコア推移グラフ。
 */
const ScoreHistoryChart = (props: Props) => {
  let canvasRef!: HTMLCanvasElement
  let chart: Chart<'line', ScoreHistoryChartPoint[], number> | undefined
  const [mounted, setMounted] = createSignal(false)

  onMount(() => {
    setMounted(true)
  })

  createEffect(() => {
    if (!mounted() || props.entries.length === 0) return

    themePreference()
    accentPreference()

    const entries = sortEntriesByUpdatedAt(props.entries)
    const color = resolveChartColor(CHART_LINE_COLOR_VARIABLE, CHART_COLOR_FALLBACK)
    const chartData: ChartData<'line', ScoreHistoryChartPoint[], number> = {
      datasets: [
        {
          label: SCORE_HISTORY_SCORE_LABEL,
          data: entries.map((entry) => ({
            x: new Date(entry.updated_at).getTime(),
            y: entry.score,
          })),
          borderColor: color,
          backgroundColor: color,
          pointBackgroundColor: color,
          pointBorderColor: color,
          pointHoverBackgroundColor: color,
          pointHoverBorderColor: color,
          pointRadius: CHART_POINT_RADIUS,
          pointHoverRadius: CHART_POINT_HOVER_RADIUS,
          borderWidth: CHART_BORDER_WIDTH,
          tension: CHART_TENSION,
        },
      ],
    }

    if (!chart) {
      chart = new Chart(canvasRef, {
        type: 'line',
        data: chartData,
        options: createScoreHistoryChartOptions(entries),
      })
      return
    }

    chart.data = chartData
    chart.options = createScoreHistoryChartOptions(entries)
    chart.update('none')
  })

  onCleanup(() => {
    chart?.destroy()
  })

  return (
    <section class="rounded-md border border-border bg-surface p-4">
      <Show
        when={props.entries.length > 0}
        fallback={
          <div class="py-10 text-center text-sm text-text-muted">{SCORE_HISTORY_EMPTY_LABEL}</div>
        }
      >
        <div class={CHART_HEIGHT_CLASS}>
          <canvas ref={canvasRef} aria-label="スコア履歴の折れ線グラフ" role="img" />
        </div>
      </Show>
    </section>
  )
}

export default ScoreHistoryChart
