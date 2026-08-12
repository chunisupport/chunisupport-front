import type { PlayerMetricHistoryMetric } from '../../../utils/playerMetricHistory'

/** 公式指標履歴ページで表示する文言。 */
export const PLAYER_METRIC_HISTORY_COPY = {
  pageTitle: 'RATING / OVER POWER履歴',
  documentTitle: 'RATING / OVER POWER履歴',
  backToProfile: 'プロフィールへ戻る',
  emptyHistory: '履歴がありません',
  tableTitle: '履歴一覧',
  tableCaption: '公式RATINGと公式OVER POWERの履歴',
  collectedAt: '取得日時',
  rating: 'RATING',
  overPower: 'OVER POWER',
  ratingChartAriaLabel: '公式RATING履歴の折れ線グラフ',
  overPowerChartAriaLabel: '公式OVER POWER履歴の折れ線グラフ',
} as const

/** 履歴グラフ1枚分の表示定義。 */
export type PlayerMetricHistoryChartDefinition = {
  metric: PlayerMetricHistoryMetric
  title: string
  ariaLabel: string
  colorVariable: string
}

/** RATINGとOVER POWERを別々の折れ線グラフとして表示する定義。 */
export const PLAYER_METRIC_HISTORY_CHART_DEFINITIONS = [
  {
    metric: 'rating',
    title: PLAYER_METRIC_HISTORY_COPY.rating,
    ariaLabel: PLAYER_METRIC_HISTORY_COPY.ratingChartAriaLabel,
    colorVariable: '--cs-color-action-primary',
  },
  {
    metric: 'overpower',
    title: PLAYER_METRIC_HISTORY_COPY.overPower,
    ariaLabel: PLAYER_METRIC_HISTORY_COPY.overPowerChartAriaLabel,
    colorVariable: '--cs-color-info',
  },
] as const satisfies readonly PlayerMetricHistoryChartDefinition[]

/** Chart.jsで使うテーマ連動の文字色CSS変数。 */
export const PLAYER_METRIC_HISTORY_TEXT_COLOR_VARIABLE = '--cs-color-text-muted'
/** Chart.jsで使うテーマ連動の罫線色CSS変数。 */
export const PLAYER_METRIC_HISTORY_GRID_COLOR_VARIABLE = '--cs-color-border'
/** Chart.jsで使う数値フォントCSS変数。 */
export const PLAYER_METRIC_HISTORY_FONT_FAMILY_VARIABLE = '--font-jost'
/** 数値フォントを解決できない場合の代替フォント。 */
export const PLAYER_METRIC_HISTORY_FONT_FAMILY_FALLBACK = 'sans-serif'
/** 履歴グラフのレスポンシブな固定高さ。 */
export const PLAYER_METRIC_HISTORY_CHART_HEIGHT_CLASS = 'h-72 sm:h-80'
/** 履歴一覧が狭い画面で列幅を維持するための最小幅。 */
export const PLAYER_METRIC_HISTORY_TABLE_MIN_WIDTH_CLASS = 'min-w-[32rem]'
/** 公式指標を画面に表示する小数点以下桁数。 */
export const PLAYER_METRIC_HISTORY_DECIMAL_PLACES = 2
/** 折れ線グラフの通常時の点半径。 */
export const PLAYER_METRIC_HISTORY_POINT_RADIUS = 3
/** 折れ線グラフのホバー時の点半径。 */
export const PLAYER_METRIC_HISTORY_POINT_HOVER_RADIUS = 5
/** タッチやポインターで点を選択できる追加範囲。 */
export const PLAYER_METRIC_HISTORY_POINT_HIT_RADIUS = 12
/** 折れ線グラフの線幅。 */
export const PLAYER_METRIC_HISTORY_BORDER_WIDTH = 2
/** 折れ線グラフの曲線補間量。 */
export const PLAYER_METRIC_HISTORY_LINE_TENSION = 0.2
