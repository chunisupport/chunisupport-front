/** 苦手譜面インスペクターの画面表示文言。 */
export const WEAK_CHART_INSPECTOR_COPY = {
  title: '苦手譜面インスペクター',
  chartTitle: '譜面定数別スコア分布',
  chartAccessibleLabel: '譜面定数ごとの獲得スコア散布図',
  outlierTitle: '外れ値に該当する譜面',
  emptyOutliers: '外れ値に該当する譜面はありません。',
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
