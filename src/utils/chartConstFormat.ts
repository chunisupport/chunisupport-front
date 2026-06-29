import { formatTruncatedFixed, truncateDecimal } from './numberFormat'

const CHART_CONST_DECIMAL_PLACES = 1

/**
 * 譜面定数を小数点以下1桁で切り捨てた数値へ正規化する。
 *
 * @param value 正規化する譜面定数。
 * @returns 小数点以下1桁で切り捨てた譜面定数。
 */
export const truncateChartConst = (value: number): number =>
  truncateDecimal(value, CHART_CONST_DECIMAL_PLACES)

/**
 * 譜面定数を小数点以下1桁で切り捨てた表示文字列へ整形する。
 *
 * @param value 整形する譜面定数。
 * @returns 小数点以下1桁に0埋めした譜面定数の表示文字列。
 */
export const formatChartConst = (value: number): string =>
  formatTruncatedFixed(value, CHART_CONST_DECIMAL_PLACES)
