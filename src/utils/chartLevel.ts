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
