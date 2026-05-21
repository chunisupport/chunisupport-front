const RATING_DECIMAL_PLACES = 4
const DECIMAL_BASE = 10

/**
 * プレイヤーレーティングを小数点以下4桁で切り捨てた表示文字列に整形する。
 *
 * @param value 整形するプレイヤーレーティング。
 * @returns 小数点以下4桁に0埋めしたプレイヤーレーティングの表示文字列。
 */
export const formatPlayerRating = (value: number): string => {
  const factor = DECIMAL_BASE ** RATING_DECIMAL_PLACES
  return (Math.trunc(value * factor) / factor).toFixed(RATING_DECIMAL_PLACES)
}
