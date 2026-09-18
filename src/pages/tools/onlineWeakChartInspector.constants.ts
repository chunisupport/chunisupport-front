/** 苦手譜面インスペクター Online の画面文言 */
export const ONLINE_WEAK_CHART_COPY = {
  title: '苦手譜面インスペクター Online',
  description: '自分のスコアを、同じレート帯の平均スコアと比較します。',
  ratingBand: '比較するレート帯',
  difficulty: '難易度',
  chartTitle: '平均スコアとの差',
  chartLabel: '横軸が譜面定数、縦軸が自分のスコアから同レート帯の平均スコアを引いた値の散布図',
  tableTitle: '平均との比較一覧',
  tableCaption: '自分のスコアと同レート帯の平均スコアの比較',
  empty: '比較できるプレイ済み譜面がありません。',
  ownScore: 'スコア',
  averageScore: '平均',
  difference: '点差',
  settingsTitle: '表示・集計範囲',
  settingsOpen: '表示・集計範囲を開く',
  displayScoreRange: '表示スコア範囲',
  filterUnselected: '未選択',
  chartConstRange: '譜面定数',
  chartConstMin: '譜面定数 最小',
  chartConstMax: '譜面定数 最大',
  reset: '初期値に戻す',
  cancel: 'キャンセル',
  apply: '適用',
  lowerDataset: '平均より低い',
  higherDataset: '平均以上',
  songTitle: '曲名',
  chartConst: '定数',
} as const

/** 散布図の譜面定数座標をずらす最大単位 */
export const ONLINE_WEAK_CHART_POINT_JITTER = 0.012

/** Online の表示・集計範囲の初期値 */
export const ONLINE_WEAK_CHART_FILTER_DEFAULT = {
  difficulties: ['MASTER', 'ULTIMA'],
  displayScoreRange: 10000,
  constMin: 1,
  constMax: 16,
  genres: null,
  versions: null,
} as const

/** Online の表示スコア範囲に指定できる最小値 */
export const ONLINE_WEAK_CHART_DISPLAY_SCORE_RANGE_MIN = 1
