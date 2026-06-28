import { formatTruncatedFixed } from '../../../utils/numberFormat.ts'

const RATING_DECIMAL_PLACES = 4
const NO_RATING_TEXT = '-'

/**
 * プレイヤーレーティングを小数点以下4桁で切り捨てた表示文字列に整形する。
 *
 * @param value 整形するプレイヤーレーティング。
 * @returns 小数点以下4桁に0埋めしたプレイヤーレーティングの表示文字列。
 */
export const formatPlayerRating = (value: number): string =>
  formatTruncatedFixed(value, RATING_DECIMAL_PLACES)

/**
 * 未計算を許容するプレイヤーレーティングを表示文字列に整形する。
 *
 * @param value 整形するプレイヤーレーティング。未計算の場合はnull。
 * @returns 小数点以下4桁のレーティング、または未計算を示す文字列。
 */
export const formatNullablePlayerRating = (value: number | null): string =>
  value === null ? NO_RATING_TEXT : formatPlayerRating(value)
