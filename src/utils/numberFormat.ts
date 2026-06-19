const DECIMAL_BASE = 10

/**
 * 数値を指定された小数点以下桁数で切り捨てた固定小数点文字列に整形する。
 *
 * @param value 整形する数値。
 * @param decimalPlaces 小数点以下の表示桁数。
 * @returns 指定桁数に0埋めした固定小数点文字列。
 */
export const formatTruncatedFixed = (value: number, decimalPlaces: number): string => {
  const factor = DECIMAL_BASE ** decimalPlaces
  return (Math.trunc(value * factor) / factor).toFixed(decimalPlaces)
}
