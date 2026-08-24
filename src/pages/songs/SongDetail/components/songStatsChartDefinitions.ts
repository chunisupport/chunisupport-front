import type { SongStatsClearDTO, SongStatsComboDTO, SongStatsRankDTO } from '../../../../types/api'

/** Chart.jsでCSSの斜線トークンを再現するための変数定義。 */
export type SongStatsChartStripePatternDefinition = {
  /** 縞の色を表すCSS変数名。 */
  colorVariable: string
  /** 縞の太さを表すCSS変数名。 */
  widthVariable: string
  /** 縞の繰り返し周期を表すCSS変数名。 */
  periodVariable: string
  /** DOM凡例へ適用するCSSグラデーション変数名。 */
  legendBackgroundVariable: string
}

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
  /** 棒グラフへ斜線を適用する場合のCSS変数定義。 */
  stripePattern?: SongStatsChartStripePatternDefinition
}

/** プラス付きスコアランクへ共通適用する斜線パターン定義。 */
export const SCORE_RANK_PLUS_CHART_STRIPE_PATTERN = {
  colorVariable: '--cs-color-score-rank-plus-stripe',
  widthVariable: '--cs-size-score-rank-plus-stripe-width',
  periodVariable: '--cs-size-score-rank-plus-stripe-period',
  legendBackgroundVariable: '--cs-gradient-score-rank-plus-bg',
} as const satisfies SongStatsChartStripePatternDefinition

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

/** 未達成系ランプをRANKグラフの〜AAAと同じ濃い灰色で表示するためのCSS変数名。 */
const UNACHIEVED_LAMP_CHART_COLOR_VARIABLE = '--cs-color-score-rank-d-bg'

/** RANK積み上げ棒グラフへ表示するデータセット定義。 */
export const RANK_CHART_DATASET_DEFINITIONS = [
  { label: '～AAA', valueKey: 'aaal', colorVariable: UNACHIEVED_LAMP_CHART_COLOR_VARIABLE },
  { label: 'S', valueKey: 's', colorVariable: '--cs-color-score-rank-s-bg' },
  {
    label: 'S+',
    valueKey: 'sp',
    colorVariable: '--cs-color-score-rank-s-bg',
    stripePattern: SCORE_RANK_PLUS_CHART_STRIPE_PATTERN,
  },
  { label: 'SS', valueKey: 'ss', colorVariable: '--cs-color-score-rank-ss-bg' },
  {
    label: 'SS+',
    valueKey: 'ssp',
    colorVariable: '--cs-color-score-rank-ss-bg',
    stripePattern: SCORE_RANK_PLUS_CHART_STRIPE_PATTERN,
  },
  { label: 'SSS', valueKey: 'sss', colorVariable: '--cs-color-score-rank-sss-bg' },
  { label: 'SSS+', valueKey: 'sssp', colorVariable: '--cs-color-score-rank-sssp-bg' },
  {
    label: 'MAX',
    valueKey: 'max',
    colorVariable: '--cs-color-lamp-all-justice-critical-bg',
    legendBackgroundVariable: '--cs-gradient-lamp-all-justice-critical-bg',
    gradientColorVariables: ALL_JUSTICE_CRITICAL_CHART_GRADIENT_COLOR_VARIABLES,
  },
] as const satisfies readonly SongStatsChartDatasetDefinition<keyof SongStatsRankDTO>[]

/** COMBOグラフに表示するデータセット定義。 */
export const COMBO_CHART_DATASET_DEFINITIONS = [
  { label: 'NONE', valueKey: 'none', colorVariable: UNACHIEVED_LAMP_CHART_COLOR_VARIABLE },
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
  { label: 'FAILED', valueKey: 'failed', colorVariable: UNACHIEVED_LAMP_CHART_COLOR_VARIABLE },
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
