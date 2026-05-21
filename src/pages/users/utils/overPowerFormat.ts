const OVER_POWER_PERCENT_DECIMAL_PLACES = 4
const DECIMAL_BASE = 10

/**
 * OVER POWER達成率を小数点以下4桁で切り捨てた表示文字列に整形する。
 *
 * @param value 整形するOVER POWER達成率。
 * @returns 小数点以下4桁に0埋めしたOVER POWER達成率の表示文字列。
 */
export const formatOverPowerPercent = (value: number): string => {
  const factor = DECIMAL_BASE ** OVER_POWER_PERCENT_DECIMAL_PLACES
  return (Math.trunc(value * factor) / factor).toFixed(OVER_POWER_PERCENT_DECIMAL_PLACES)
}
