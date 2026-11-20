import type { SongStatsClearDTO, SongStatsComboDTO, SongStatsRankDTO } from '../../../../types/api'
import {
  type StatsChartDatasetDefinition,
  type StatsChartStripePatternDefinition,
  UNACHIEVED_LAMP_CHART_COLOR_VARIABLE,
} from '../../components/statsChartDefinitions'

/** プラス付きスコアランクへ共通適用する斜線パターン定義 */
export const SCORE_RANK_PLUS_CHART_STRIPE_PATTERN = {
  colorVariable: '--cs-color-score-rank-plus-stripe',
  widthVariable: '--cs-size-score-rank-plus-stripe-width',
  periodVariable: '--cs-size-score-rank-plus-stripe-period',
  legendBackgroundVariable: '--cs-gradient-score-rank-plus-bg',
} as const satisfies StatsChartStripePatternDefinition

/** AJC表現と同じ淡い虹色グラデーションをChart.jsへ渡すCSS変数列 */
export const ALL_JUSTICE_CRITICAL_CHART_GRADIENT_COLOR_VARIABLES = [
  '--cs-color-lamp-all-justice-critical-rainbow-1',
  '--cs-color-lamp-all-justice-critical-rainbow-2',
  '--cs-color-lamp-all-justice-critical-rainbow-3',
  '--cs-color-lamp-all-justice-critical-rainbow-4',
  '--cs-color-lamp-all-justice-critical-rainbow-5',
  '--cs-color-lamp-all-justice-critical-rainbow-6',
  '--cs-color-lamp-all-justice-critical-rainbow-7',
] as const

/** RANK積み上げ棒グラフへ表示するデータセット定義 */
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
] as const satisfies readonly StatsChartDatasetDefinition<keyof SongStatsRankDTO>[]

/** COMBOグラフに表示するデータセット定義 */
export const COMBO_CHART_DATASET_DEFINITIONS = [
  { label: 'NONE', valueKey: 'none', colorVariable: UNACHIEVED_LAMP_CHART_COLOR_VARIABLE },
  { label: 'FC', valueKey: 'fc', colorVariable: '--cs-color-lamp-full-combo-bg', gloss: true },
  { label: 'AJ', valueKey: 'aj', colorVariable: '--cs-color-lamp-all-justice-bg', gloss: true },
  {
    label: 'AJC',
    valueKey: 'ajc',
    colorVariable: '--cs-color-lamp-all-justice-critical-bg',
    legendBackgroundVariable: '--cs-gradient-lamp-all-justice-critical-bg',
    gradientColorVariables: ALL_JUSTICE_CRITICAL_CHART_GRADIENT_COLOR_VARIABLES,
  },
] as const satisfies readonly StatsChartDatasetDefinition<keyof SongStatsComboDTO>[]

/** HARDグラフに表示するデータセット定義 */
export const CLEAR_CHART_DATASET_DEFINITIONS = [
  { label: 'FAILED', valueKey: 'failed', colorVariable: UNACHIEVED_LAMP_CHART_COLOR_VARIABLE },
  { label: 'CLEAR', valueKey: 'clear', colorVariable: '--cs-color-lamp-clear-bg' },
  { label: 'HARD', valueKey: 'hard', colorVariable: '--cs-color-lamp-hard-bg' },
  { label: 'BRAVE', valueKey: 'brave', colorVariable: '--cs-color-lamp-brave-bg', gloss: true },
  {
    label: 'ABSOLUTE',
    valueKey: 'absolute',
    colorVariable: '--cs-color-lamp-absolute-bg',
    gloss: true,
  },
  {
    label: 'CATASTROPHY',
    valueKey: 'catastrophy',
    colorVariable: '--cs-color-lamp-catastrophy-bg',
    gloss: true,
  },
] as const satisfies readonly StatsChartDatasetDefinition<keyof SongStatsClearDTO>[]
