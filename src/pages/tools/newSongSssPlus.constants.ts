/** ベスト枠・新曲枠理論値チェッカーで使用する文言。 */
export const NEW_SONG_SSS_PLUS_COPY = {
  title: 'ベスト枠・新曲枠理論値チェッカー',
  description: '全譜面SSS+時の理論値と、対象譜面の現在スコアを確認できます。',
  ariaLabel: 'レーティング枠理論値チェック',
  targetRating: '理論値',
  currentGap: '現在との差',
  loadingLabel: 'レーティング枠理論値を計算中',
  noData: '対象譜面がありません',
  emptyValue: '-',
  unknownChartConstant: '未確定の譜面定数を含む推定値',
  unknownMarker: '?',
  bestDetailsLabel: 'ベスト枠理論値対象譜面',
  newDetailsLabel: '新曲枠理論値対象譜面',
  chartCountSuffix: '譜面',
  singleRatingLabel: '単曲RATING',
  chartConstantLabel: '譜面定数',
  candidateSlotLabel: '候補',
  currentScoreLabel: '現在スコア',
  scoreGapLabel: 'SSS+まで',
  recordUnavailable: 'スコアなし',
  scoreSourceLabel: '反映するスコア',
} as const

/** 理論値チェッカーの表示枠タブ。 */
export const RATING_THEORETICAL_TAB_OPTIONS = [
  { value: 'best', label: 'ベスト枠' },
  { value: 'new', label: '新曲枠' },
] as const

/** 理論値対象譜面へ反映するスコアの取得範囲。 */
export const RATING_SCORE_SOURCE_OPTIONS = [
  { value: 'frame', label: '枠状況', description: '採用枠・候補枠' },
  { value: 'records', label: 'レコード状況', description: '全レコード' },
] as const
