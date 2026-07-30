/** レーティング対象として表示する規定枠数。 */
export const RATING_SLOT_COUNT = {
  best: 30,
  new: 20,
} as const

/**
 * 空きレーティング枠の読み上げ文言を生成する。
 *
 * @param slotNumber - 1始まりの枠番号。
 * @returns 空き枠であることを示す読み上げ文言。
 */
export const buildEmptyRatingSlotLabel = (slotNumber: number): string => `${slotNumber}番は空き枠`
