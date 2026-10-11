import { MAX_SCORE, SCORE_RANK_MIN_SCORES } from './scoreRank'

/** 計算機で表示・入力するOVER POWERの小数桁数。 */
export const CALCULATOR_VALUE_DECIMALS = 3
/** 計算機で表示・入力する達成率の小数桁数。 */
export const CALCULATOR_PERCENT_DECIMALS = 5
/** 達成率入力の上限。 */
export const CALCULATOR_PERCENT_MAX = 100
/** 必要譜面数に使うランク境界スコア。 */
export const REQUIRED_CHART_SCORE_ROWS = [
  { label: 'SS', score: SCORE_RANK_MIN_SCORES.SS },
  { label: 'SS+', score: SCORE_RANK_MIN_SCORES['SS+'] },
  { label: 'SSS', score: SCORE_RANK_MIN_SCORES.SSS },
  { label: 'SSS+', score: SCORE_RANK_MIN_SCORES['SSS+'] },
  { label: '理論値', score: MAX_SCORE },
] as const
/** 必要譜面数の通常・FC・AJ列。理論値は通常列のみ表示する。 */
export const REQUIRED_CHART_LAMP_COLUMNS = [
  { label: '通常', value: null },
  { label: 'FC', value: 'FULL COMBO' },
  { label: 'AJ', value: 'ALL JUSTICE' },
] as const
