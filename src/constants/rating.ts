/** レーティング対象として表示・計算する規定枠数 */
export const RATING_SLOT_COUNT = {
  best: 30,
  new: 20,
} as const

/** 全曲ベスト枠として表示・平均する件数 */
export const ALL_SONG_BEST_SLOT_COUNT = {
  primary: RATING_SLOT_COUNT.best,
  total: RATING_SLOT_COUNT.best + RATING_SLOT_COUNT.new,
} as const
