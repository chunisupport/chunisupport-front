const DECIMAL_BASE = 10

/**
 * 数値を指定された小数点以下桁数で切り捨てる。
 *
 * @param value 切り捨てる数値。
 * @param decimalPlaces 小数点以下の桁数。
 * @returns 指定桁数で切り捨てた数値。
 */
export const truncateDecimal = (value: number, decimalPlaces: number): number => {
  const factor = DECIMAL_BASE ** decimalPlaces
  const scaled = value * factor
  const epsilon = Number.EPSILON * Math.max(1, Math.abs(scaled)) * 8
  const adjusted = scaled > 0 ? scaled + epsilon : scaled < 0 ? scaled - epsilon : scaled
  return Math.trunc(adjusted) / factor
}

/**
 * 数値を指定された小数点以下桁数で切り捨てた固定小数点文字列へ整形する。
 *
 * @param value 整形する数値。
 * @param decimalPlaces 小数点以下の表示桁数。
 * @returns 指定桁数に0埋めした固定小数点文字列。
 */
export const formatTruncatedFixed = (value: number, decimalPlaces: number): string =>
  truncateDecimal(value, decimalPlaces).toFixed(decimalPlaces)

/**
 * 数値を指定された小数点以下桁数の固定小数点文字列へ整形する。
 *
 * @param value 整形する数値。
 * @param decimalPlaces 小数点以下の表示桁数。
 * @returns 指定桁数に0埋めした固定小数点文字列。
 */
export const formatFixed = (value: number, decimalPlaces: number): string =>
  value.toFixed(decimalPlaces)

/**
 * 数値を日本語ロケールの整数区切り文字列へ整形する。
 *
 * @param value 整形する数値。
 * @returns 3桁区切りの整数表示文字列。
 */
export const formatInteger = (value: number): string => value.toLocaleString('ja-JP')
