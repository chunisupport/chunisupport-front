import { CHART_CONST_MAX, CHART_CONST_MIN } from '../constants/chart'
import type { NumericRangeFilter } from '../types/record'

export type ChartLevelLabel = `${number}` | `${number}+`

export const toChartLevelLabel = (chartConst: number): ChartLevelLabel => {
  const integerPart = Math.floor(chartConst)
  const decimalPart = Math.round((chartConst - integerPart) * 10)
  return decimalPart >= 5 ? `${integerPart}+` : `${integerPart}`
}

export const getChartLevelSortKey = (label: ChartLevelLabel): number => {
  const isPlus = label.endsWith('+')
  const base = Number.parseInt(isPlus ? label.slice(0, -1) : label, 10)
  return base * 2 + (isPlus ? 1 : 0)
}

export const isLowChartLevel = (label: ChartLevelLabel): boolean =>
  getChartLevelSortKey(label) < getChartLevelSortKey('10')

/**
 * 表示レベルを対応する譜面定数範囲へ変換する。
 *
 * @param label - `14`、`14+`などの表示レベル。
 * @returns 指定レベルに含まれる譜面定数の最小値と最大値。
 */
export const getChartLevelConstRange = (label: ChartLevelLabel): NumericRangeFilter => {
  const isPlus = label.endsWith('+')
  const base = Number.parseInt(isPlus ? label.slice(0, -1) : label, 10)
  const min = isPlus ? base + 0.5 : base
  const max = isPlus ? base + 0.9 : base + 0.4

  return {
    min: Math.max(CHART_CONST_MIN, min),
    max: Math.min(CHART_CONST_MAX, max),
  }
}
