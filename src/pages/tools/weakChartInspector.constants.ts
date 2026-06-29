/** 苦手譜面インスペクターの画面表示文言。 */
export const WEAK_CHART_INSPECTOR_COPY = {
  title: '苦手譜面インスペクター',
  chartTitle: '譜面定数別スコア分布',
  chartAccessibleLabel: '譜面定数ごとの獲得スコア散布図',
  outlierTitle: '苦手かもしれない譜面',
  emptyOutliers: '該当する譜面はありません。',
  emptyRecords: '分析できるプレイ済み譜面がありません。',
  tableCaption: '外れ値と判定された譜面',
} as const

/** Chart.jsへ渡すCSSカスタムプロパティ名。 */
export const WEAK_CHART_INSPECTOR_COLORS = {
  text: '--cs-color-text-muted',
  grid: '--cs-color-border',
  point: '--cs-color-weak-chart-point',
  outlier: '--cs-color-weak-chart-outlier',
} as const

/** スコア点を重ねる際の横方向の最大ずらし幅。 */
export const WEAK_CHART_POINT_JITTER = 0.035

/** 散布図のスコア軸目盛り間隔とk表記の換算値。 */
export const WEAK_CHART_SCORE_TICK_INTERVAL = 1000

/** 下部ナビゲーションで表示できる最大幅を基準にした散布図の最小幅。 */
export const WEAK_CHART_MIN_WIDTH_CLASS = 'min-w-[44rem]'

/** グラフ設定画面の表示文言。 */
export const WEAK_CHART_SETTINGS_COPY = {
  title: 'グラフ設定',
  displaySection: '表示の絞り込み',
  aggregationSection: '集計対象の絞り込み',
  scoreRangeLabel: 'スコア',
  constRangeLabel: '譜面定数',
  cancel: 'キャンセル',
  reset: '初期値に戻す',
  apply: '適用',
} as const

/** グラフ軸設定（表示の絞り込み）の初期値。 */
export const WEAK_CHART_AXIS_SETTINGS_DEFAULT = {
  yMin: 1000000,
  yMax: 1010000,
  xMin: 10.0,
  xMax: 16.0,
} as const

/** グラフ集計対象設定（集計対象の絞り込み）の初期値。 */
export const WEAK_CHART_AGGREGATION_SETTINGS_DEFAULT = {
  scoreMin: 0,
  scoreMax: 1010000,
  constMin: 1.0,
  constMax: 16.0,
} as const

/** 苦手譜面インスペクターの集計対象難易度選択肢。 */
export const WEAK_CHART_AGGREGATION_DIFFICULTIES = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
  'ULTIMA',
] as const

/** 集計対象とする初期難易度。 */
export const WEAK_CHART_AGGREGATION_DIFFICULTIES_DEFAULT: readonly string[] = ['MASTER', 'ULTIMA']
