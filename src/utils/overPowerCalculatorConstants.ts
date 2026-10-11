/** 計算機で表示・入力するOVER POWERの小数桁数。 */
export const CALCULATOR_VALUE_DECIMALS = 3
/** 計算機で表示・入力する達成率の小数桁数。 */
export const CALCULATOR_PERCENT_DECIMALS = 5
/** 達成率入力の上限。 */
export const CALCULATOR_PERCENT_MAX = 100
/** 必要譜面数の通常・FC・AJ列。理論値は通常列のみ表示する。 */
export const REQUIRED_CHART_LAMP_COLUMNS = [
  { label: 'なし', value: null },
  { label: 'FULL COMBO', value: 'FULL COMBO' },
  { label: 'ALL JUSTICE', value: 'ALL JUSTICE' },
] as const
