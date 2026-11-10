import { formatTruncatedFixed } from './numberFormat'

const PLAYER_RATING_DECIMAL_PLACES = 4
const RATING_FIXED_2_DECIMAL_PLACES = 2
const NO_RATING_TEXT = '-'

/**
 * プレイヤーレーティングを小数点以下4桁で切り捨てた表示文字列へ整形する。
 *
 * @param value 整形するプレイヤーレーティング。
 * @returns 小数点以下4桁に0埋めしたプレイヤーレーティングの表示文字列。
 */
export const formatPlayerRating = (value: number): string =>
  formatTruncatedFixed(value, PLAYER_RATING_DECIMAL_PLACES)

/**
 * 未計算を許容するプレイヤーレーティングを表示文字列へ整形する。
 *
 * @param value 整形するプレイヤーレーティング。未計算の場合はnull。
 * @returns 小数点以下4桁のレーティング、または未計算を示す文字列。
 */
export const formatNullablePlayerRating = (value: number | null): string =>
  value === null ? NO_RATING_TEXT : formatPlayerRating(value)

/**
 * レーティングを小数点以下2桁で切り捨てた表示文字列へ整形する。
 *
 * @param value 整形するレーティング。
 * @returns 小数点以下2桁に0埋めしたレーティングの表示文字列。
 */
export const formatRatingFixed2 = (value: number): string =>
  formatTruncatedFixed(value, RATING_FIXED_2_DECIMAL_PLACES)
