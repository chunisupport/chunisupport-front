import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  type ChartData,
  type ChartOptions,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { createEffect, createMemo, createSignal, For, onCleanup, onMount } from 'solid-js'
import type { RatingBandDTO, SongStatsBandDTO } from '../../../../types/api'
import { isOwnBestAverageRatingBand } from './songStatsHighlight'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip)

type Props = {
  stats: SongStatsBandDTO[]
  bestAverage?: number | null
  ratingBands?: RatingBandDTO[]
}

type SongStatsChartDataset = {
  label: string
  values: number[]
  colorVariable: string
}

type SongStatsChartProps = {
  title: string
  ariaLabel: string
  labels: string[]
  datasets: SongStatsChartDataset[]
}

const CHART_HEIGHT_CLASS = 'h-72'
const CHART_COLOR_FALLBACK = '#6b7280'
const CHART_DEFAULT_TEXT_COLOR = '--cs-color-text'
const CHART_DEFAULT_GRID_COLOR = '--cs-color-border'
const CHART_EXCLUDED_RATING_BAND = 'ALL'
const HIGHLIGHTED_RATING_BAND_ROW_CLASS =
  'border-l-4 border-l-action-primary bg-action-primary-muted font-semibold'
const NORMAL_RATING_BAND_ROW_CLASS = 'border-l-4 border-l-transparent'
const COMBO_CHART_DATASET_DEFINITIONS = [
  { label: 'FC', valueKey: 'fc', colorVariable: '--cs-color-lamp-full-combo-bg' },
  { label: 'AJ', valueKey: 'aj', colorVariable: '--cs-color-lamp-all-justice-bg' },
  {
    label: 'AJC',
    valueKey: 'ajc',
    colorVariable: '--cs-color-lamp-all-justice-critical-bg',
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

/** 現在のロケールにおける小数点セパレータを取得する。 */
const getDecimalSeparator = (): string => (1.1).toLocaleString().charAt(1)

/**
 * 平均スコアを整数部と小数部に分割して表示する。
 * @param score 表示するスコア値。
 * @returns 小数部のみフォントサイズを小さくした JSX。
 */
const formatAverageScore = (score: number) => {
  const formatted = score.toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
  const sep = getDecimalSeparator()
  const idx = formatted.lastIndexOf(sep)
  if (idx === -1) return formatted
  return (
    <>
      {formatted.slice(0, idx)}
      <span class="text-[0.8em]">{formatted.slice(idx)}</span>
    </>
  )
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
          autoSkip: false,
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
      <div class={CHART_HEIGHT_CLASS}>
        <canvas ref={canvasRef} aria-label={props.ariaLabel} role="img" />
      </div>
    </section>
  )
}

/**
 * 難易度別統計テーブルの下に表示するランプ別グラフを生成する。
 * @param props 表示対象の統計行。
 * @returns FC/AJ/AJCとCLEAR系ランプのグラフ。
 */
const SongStatsCharts = (props: Props) => {
  const chartStats = createMemo(() => getChartStats(props.stats))
  const labels = createMemo(() => chartStats().map((band) => band.rating_band))
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

  return (
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
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
    </div>
  )
}

/**
 * 楽曲詳細ページのレーティング帯別統計を表とグラフで表示する。
 * @param props 表示する統計行。
 * @returns 難易度別統計テーブルとランプ別グラフ。
 */
const SongStatsTable = (props: Props) => {
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
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-surface-muted">
            <tr>
              <th class="px-2 py-2 text-left whitespace-nowrap">ベスト枠平均</th>
              <th class="px-2 py-2 text-right whitespace-nowrap">人数</th>
              <th class="px-2 py-2 text-right whitespace-nowrap">平均スコア</th>
              <th class="px-2 py-2 text-right whitespace-nowrap">FC</th>
              <th class="px-2 py-2 text-right whitespace-nowrap">AJ</th>
              <th class="px-2 py-2 text-right whitespace-nowrap">AJC</th>
              <th class="px-2 py-2 text-right whitespace-nowrap">CLEAR</th>
              <th class="px-2 py-2 text-right whitespace-nowrap">HARD</th>
              <th class="px-2 py-2 text-right whitespace-nowrap">BRAVE</th>
              <th class="px-2 py-2 text-right whitespace-nowrap">ABSOLUTE</th>
              <th class="px-2 py-2 text-right whitespace-nowrap">CATASTROPHY</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.stats}>
              {(band) => (
                <tr class={getRowClass(band.rating_band)}>
                  <td class="px-2 py-2">{band.rating_band}</td>
                  <td class="px-2 py-2 text-right">{band.player_count.toLocaleString()}</td>
                  <td class="px-2 py-2 text-right">
                    {band.average_score === null ? '-' : formatAverageScore(band.average_score)}
                  </td>
                  <td class="px-2 py-2 text-right">{band.combo.fc.toLocaleString()}</td>
                  <td class="px-2 py-2 text-right">{band.combo.aj.toLocaleString()}</td>
                  <td class="px-2 py-2 text-right">{band.combo.ajc.toLocaleString()}</td>
                  <td class="px-2 py-2 text-right">{band.clear.clear.toLocaleString()}</td>
                  <td class="px-2 py-2 text-right">{band.clear.hard.toLocaleString()}</td>
                  <td class="px-2 py-2 text-right">{band.clear.brave.toLocaleString()}</td>
                  <td class="px-2 py-2 text-right">{band.clear.absolute.toLocaleString()}</td>
                  <td class="px-2 py-2 text-right">{band.clear.catastrophy.toLocaleString()}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
      <SongStatsCharts stats={props.stats} />
    </>
  )
}

export default SongStatsTable
