import { CHART_CONST_MAX, CHART_CONST_MIN } from '../constants/chart'
import type { NumericRangeFilter } from '../types/record'

export type ChartLevelLabel = `${number}` | `${number}+`

/** レベル範囲フィルターで選択できる表示レベル */
export const CHART_LEVEL_FILTER_OPTIONS: readonly ChartLevelLabel[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '7+',
  '8',
  '8+',
  '9',
  '9+',
  '10',
  '10+',
  '11',
  '11+',
  '12',
  '12+',
  '13',
  '13+',
  '14',
  '14+',
  '15',
  '15+',
  '16',
]

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

/**
 * 譜面定数を範囲フィルターの選択レベルへ変換する。
 *
 * @param chartConst - 変換する譜面定数。
 * @returns 6以下をプラスなしでまとめた表示レベル。
 */
export const toChartLevelFilterLabel = (chartConst: number): ChartLevelLabel => {
  const normalized = Math.max(CHART_CONST_MIN, Math.min(chartConst, CHART_CONST_MAX))
  return normalized <= 6.9 ? `${Math.floor(normalized)}` : toChartLevelLabel(normalized)
}

/**
 * 範囲フィルターの表示レベルを譜面定数の端点へ変換する。
 *
 * @param label - 変換する表示レベル。
 * @param endpoint - 範囲の下限または上限。
 * @returns 表示レベルに対応する譜面定数の端点。
 */
export const getChartLevelFilterBoundary = (
  label: ChartLevelLabel,
  endpoint: 'min' | 'max'
): number => {
  const base = Number.parseInt(label, 10)
  if (base <= 6) return endpoint === 'min' ? base : base + 0.9
  const range = getChartLevelConstRange(label)
  return range[endpoint]
}
