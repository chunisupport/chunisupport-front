import type { CourseStatsBandDTO } from '../../../types/api'

/** Chart.jsでCSSの斜線トークンを再現するための変数定義 */
export type StatsChartStripePatternDefinition = {
  /** 縞の色を表すCSS変数名 */
  colorVariable: string
  /** 縞の太さを表すCSS変数名 */
  widthVariable: string
  /** 縞の繰り返し周期を表すCSS変数名 */
  periodVariable: string
  /** DOM凡例へ適用するCSSグラデーション変数名 */
  legendBackgroundVariable: string
}

/** 統計グラフ1系列を表す定義 */
export type StatsChartDatasetDefinition<ValueKey extends string> = {
  /** 凡例とツールチップへ表示するラベル */
  label: string
  /** APIレスポンス内で人数を参照するキー */
  valueKey: ValueKey
  /** 棒グラフの色に利用するCSS変数名 */
  colorVariable: string
  /** 凡例背景だけを上書きするCSS変数名 */
  legendBackgroundVariable?: string
  /** 棒グラフへグラデーションを適用する場合のCSS変数名一覧 */
  gradientColorVariables?: readonly string[]
  /** 棒グラフへ斜線を適用する場合のCSS変数定義 */
  stripePattern?: StatsChartStripePatternDefinition
  /** 棒グラフへランプ用の光沢を重ねるか */
  gloss?: boolean
}

/** Chart.jsの棒へ左から右に重ねる光沢の色停止点。ランプバッジの光沢と同じトークンを使う */
export const LAMP_CHART_GLOSS_COLOR_STOPS = [
  { offset: 0, colorVariable: '--cs-color-lamp-badge-gloss-edge-light' },
  { offset: 0.28, colorVariable: '--cs-color-lamp-badge-gloss-highlight' },
  { offset: 0.46, colorVariable: '--cs-color-lamp-badge-gloss-fade' },
  { offset: 0.54, colorVariable: '--cs-color-lamp-badge-gloss-shade' },
  { offset: 0.76, colorVariable: '--cs-color-lamp-badge-gloss-reflect' },
  { offset: 1, colorVariable: '--cs-color-lamp-badge-gloss-edge-dark' },
] as const

/** Chart.jsの棒へ重ねる光沢の不透明度。バッジより面積が大きいため控えめにする */
export const LAMP_CHART_GLOSS_OPACITY = 0.6

/** 未達成系ランプをRANKグラフの〜AAAと同じ濃い灰色で表示するためのCSS変数名 */
export const UNACHIEVED_LAMP_CHART_COLOR_VARIABLE = '--cs-color-score-rank-d-bg'

/** コース詳細のCLEAR積み上げ棒グラフに表示するデータセット定義 */
export const COURSE_CLEAR_CHART_DATASET_DEFINITIONS = [
  { label: 'FAILED', valueKey: 'failed', colorVariable: UNACHIEVED_LAMP_CHART_COLOR_VARIABLE },
  { label: 'CLEAR', valueKey: 'clear', colorVariable: '--cs-color-lamp-clear-bg' },
] as const satisfies readonly StatsChartDatasetDefinition<keyof CourseStatsBandDTO['clear']>[]

/** コース詳細のCOMBO積み上げ棒グラフに表示するデータセット定義 */
export const COURSE_COMBO_CHART_DATASET_DEFINITIONS = [
  { label: 'NONE', valueKey: 'none', colorVariable: UNACHIEVED_LAMP_CHART_COLOR_VARIABLE },
  { label: 'FC', valueKey: 'fc', colorVariable: '--cs-color-lamp-full-combo-bg', gloss: true },
  { label: 'AJ', valueKey: 'aj', colorVariable: '--cs-color-lamp-all-justice-bg', gloss: true },
] as const satisfies readonly StatsChartDatasetDefinition<keyof CourseStatsBandDTO['combo']>[]
