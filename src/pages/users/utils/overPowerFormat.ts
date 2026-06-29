import { formatTruncatedFixed } from '../../../utils/numberFormat'

const OVER_POWER_PERCENT_DECIMAL_PLACES = 4
const OVER_POWER_VALUE_DECIMAL_PLACES = 3

/**
 * OVER POWER値を小数点以下3桁の固定小数点表示文字列に整形する。
 *
 * @param value 整形するOVER POWER値。
 * @returns 小数点以下3桁に0埋めしたOVER POWER値の表示文字列。
 */
export const formatOverPowerValue = (value: number): string =>
  formatTruncatedFixed(value, OVER_POWER_VALUE_DECIMAL_PLACES)

/**
 * OVER POWER達成率を小数点以下4桁で切り捨てた表示文字列に整形する。
 *
 * @param value 整形するOVER POWER達成率。
 * @param decimalPlaces 小数点以下の表示桁数。
 * @returns 小数点以下4桁に0埋めしたOVER POWER達成率の表示文字列。
 */
export const formatOverPowerPercent = (
  value: number,
  decimalPlaces = OVER_POWER_PERCENT_DECIMAL_PLACES
): string => formatTruncatedFixed(value, decimalPlaces)
