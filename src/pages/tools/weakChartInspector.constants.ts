/** 苦手譜面インスペクターの画面表示文言。 */
export const WEAK_CHART_INSPECTOR_COPY = {
  title: '苦手譜面インスペクター',
  chartTitle: '譜面定数別スコア分布',
  chartAccessibleLabel: '譜面定数ごとの獲得スコア散布図',
  outlierTitle: '苦手かもしれない譜面',
  emptyOutliers: '苦手かもしれない譜面はありません。',
  emptyRecords: '分析できるプレイ済み譜面がありません。',
  tableCaption: 'Tukey法で外れ値と判定された譜面',
} as const

/** Chart.jsへ渡すCSSカスタムプロパティ名。 */
export const WEAK_CHART_INSPECTOR_COLORS = {
  text: '--cs-color-text-muted',
  grid: '--cs-color-border',
  point: '--cs-color-action-primary',
  outlier: '--cs-color-danger',
} as const

/** スコア点を重ねる際の横方向の最大ずらし幅。 */
export const WEAK_CHART_POINT_JITTER = 0.035

/** 散布図のスコア軸目盛り間隔とk表記の換算値。 */
export const WEAK_CHART_SCORE_TICK_INTERVAL = 1000

/** 下部ナビゲーションで表示できる最大幅を基準にした散布図の最小幅。 */
export const WEAK_CHART_MIN_WIDTH_CLASS = 'min-w-[44rem]'
