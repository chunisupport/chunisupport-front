/** ベスト枠ランキング画面の表示文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const BEST_SLOT_RANKING_COPY = {
  ratingBandLabel: 'ベスト枠平均',
  tableCaption: 'ベスト枠採用率ランキング',
  rankColumn: '順位',
  chartColumn: '譜面',
  constColumn: '定数',
  averageScoreColumn: '平均スコア',
  scoreDifferenceColumn: '自分との差',
  percentageColumn: '割合',
  ownBestLabel: '自分のベスト枠',
  empty: 'このレート帯にはランキングデータがありません。',
  loadMore: 'さらに表示',
} as const

/** 採用率表示で切り捨て・固定表示する小数点以下桁数 */
export const BEST_SLOT_PERCENTAGE_DECIMAL_PLACES = 2
