/** 苦手譜面インスペクター Online の画面文言 */
export const ONLINE_WEAK_CHART_COPY = {
  title: '苦手譜面インスペクター Online',
  description: '自分のスコアを、同じレート帯の平均スコアと比較します。',
  ratingBand: '比較するレート帯',
  difficulty: '難易度',
  chartTitle: '譜面定数別の平均スコアとの差',
  chartLabel: '横軸が譜面定数、縦軸が自分のスコアから同レート帯の平均スコアを引いた値の散布図',
  tableTitle: '平均との比較一覧',
  tableCaption: '自分のスコアと同レート帯の平均スコアの比較',
  empty: '比較できるプレイ済み譜面がありません。',
  more: 'さらに表示',
  ownScore: '自分のスコア',
  averageScore: 'レート帯平均',
  difference: '平均との差',
  xAxis: '譜面定数',
  yAxis: '平均との差（点）',
  lowerDataset: '平均より低い',
  higherDataset: '平均以上',
  songTitle: '曲名',
  chartConst: '定数',
} as const

/** 一度に表示する比較表の行数 */
export const ONLINE_WEAK_CHART_PAGE_SIZE = 100

/** 散布図の譜面定数座標をずらす最大単位 */
export const ONLINE_WEAK_CHART_POINT_JITTER = 0.012
