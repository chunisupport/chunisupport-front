import type { SongStatsClearDTO, SongStatsComboDTO } from '../../../../types/api'

/** 楽曲詳細の統計グラフ1系列を表す定義。 */
export type SongStatsChartDatasetDefinition<ValueKey extends string> = {
  /** 凡例とツールチップへ表示するラベル。 */
  label: string
  /** APIレスポンス内で人数を参照するキー。 */
  valueKey: ValueKey
  /** 棒グラフの色に利用するCSS変数名。 */
  colorVariable: string
  /** 凡例背景だけを上書きするCSS変数名。 */
  legendBackgroundVariable?: string
  /** 棒グラフへグラデーションを適用する場合のCSS変数名一覧。 */
  gradientColorVariables?: readonly string[]
}

/** AJC表現と同じ淡い虹色グラデーションをChart.jsへ渡すCSS変数列。 */
export const ALL_JUSTICE_CRITICAL_CHART_GRADIENT_COLOR_VARIABLES = [
  '--cs-color-lamp-all-justice-critical-rainbow-1',
  '--cs-color-lamp-all-justice-critical-rainbow-2',
  '--cs-color-lamp-all-justice-critical-rainbow-3',
  '--cs-color-lamp-all-justice-critical-rainbow-4',
  '--cs-color-lamp-all-justice-critical-rainbow-5',
  '--cs-color-lamp-all-justice-critical-rainbow-6',
  '--cs-color-lamp-all-justice-critical-rainbow-7',
] as const

/** COMBOグラフに表示するデータセット定義。 */
export const COMBO_CHART_DATASET_DEFINITIONS = [
  { label: 'NONE', valueKey: 'none', colorVariable: '--cs-color-lamp-none-bg' },
  { label: 'FC', valueKey: 'fc', colorVariable: '--cs-color-lamp-full-combo-bg' },
  { label: 'AJ', valueKey: 'aj', colorVariable: '--cs-color-lamp-all-justice-bg' },
  {
    label: 'AJC',
    valueKey: 'ajc',
    colorVariable: '--cs-color-lamp-all-justice-critical-bg',
    legendBackgroundVariable: '--cs-gradient-lamp-all-justice-critical-bg',
    gradientColorVariables: ALL_JUSTICE_CRITICAL_CHART_GRADIENT_COLOR_VARIABLES,
  },
] as const satisfies readonly SongStatsChartDatasetDefinition<keyof SongStatsComboDTO>[]

/** HARDグラフに表示するデータセット定義。 */
export const CLEAR_CHART_DATASET_DEFINITIONS = [
  { label: 'FAILED', valueKey: 'failed', colorVariable: '--cs-color-lamp-failed-bg' },
  { label: 'CLEAR', valueKey: 'clear', colorVariable: '--cs-color-lamp-clear-bg' },
  { label: 'HARD', valueKey: 'hard', colorVariable: '--cs-color-lamp-hard-bg' },
  { label: 'BRAVE', valueKey: 'brave', colorVariable: '--cs-color-lamp-brave-bg' },
  { label: 'ABSOLUTE', valueKey: 'absolute', colorVariable: '--cs-color-lamp-absolute-bg' },
  {
    label: 'CATASTROPHY',
    valueKey: 'catastrophy',
    colorVariable: '--cs-color-lamp-catastrophy-bg',
  },
] as const satisfies readonly SongStatsChartDatasetDefinition<keyof SongStatsClearDTO>[]
