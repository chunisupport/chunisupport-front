import {
  JUSTICE_COUNT_MAX,
  JUSTICE_COUNT_MIN,
  OVER_POWER_MAX,
  OVER_POWER_MIN,
  SINGLE_RATING_MAX,
  SINGLE_RATING_MIN,
} from '../../../constants/chart'

/** 範囲フィルターの入力欄設定 */
export type NumericRangeFilterConfig = {
  idPrefix: string
  title: string
  minLabel: string
  maxLabel: string
  min: number
  max: number
  step: number
  allowedInput: RegExp
  inputMode: 'decimal' | 'numeric'
  pattern: string
}

/** JUSTICE数フィルターの入力欄設定 */
export const JUSTICE_COUNT_RANGE_FILTER: NumericRangeFilterConfig = {
  idPrefix: 'justice-count',
  title: 'JUSTICE数',
  minLabel: 'JUSTICE数 ここから',
  maxLabel: 'JUSTICE数 ここまで',
  min: JUSTICE_COUNT_MIN,
  max: JUSTICE_COUNT_MAX,
  step: 1,
  allowedInput: /[0-9]/,
  inputMode: 'numeric',
  pattern: '[0-9]*',
}

/** OVER POWERフィルターの入力欄設定 */
export const OVER_POWER_RANGE_FILTER: NumericRangeFilterConfig = {
  idPrefix: 'over-power',
  title: 'OVER POWER',
  minLabel: 'OVER POWER ここから',
  maxLabel: 'OVER POWER ここまで',
  min: OVER_POWER_MIN,
  max: OVER_POWER_MAX,
  step: 0.001,
  allowedInput: /[0-9.]/,
  inputMode: 'decimal',
  pattern: '[0-9]*\\.?[0-9]*',
}

/** 単曲レートフィルターの入力欄設定 */
export const SINGLE_RATING_RANGE_FILTER: NumericRangeFilterConfig = {
  idPrefix: 'single-rating',
  title: '単曲レート',
  minLabel: '単曲レート ここから',
  maxLabel: '単曲レート ここまで',
  min: SINGLE_RATING_MIN,
  max: SINGLE_RATING_MAX,
  step: 0.01,
  allowedInput: /[0-9.]/,
  inputMode: 'decimal',
  pattern: '[0-9]*\\.?[0-9]*',
}
