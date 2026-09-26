import {
  JUSTICE_COUNT_MAX,
  JUSTICE_COUNT_MIN,
  OVER_POWER_MAX,
  OVER_POWER_MIN,
  SINGLE_RATING_MAX,
  SINGLE_RATING_MIN,
} from '../../../constants/chart'
import { localizedCopy } from '../../../i18n'

/** 数値範囲フィルターの表示文言 */
const RANGE_FILTER_TEXT = localizedCopy('users.rangeFilters')

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
  title: RANGE_FILTER_TEXT.justice,
  minLabel: RANGE_FILTER_TEXT.justiceMin,
  maxLabel: RANGE_FILTER_TEXT.justiceMax,
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
  minLabel: RANGE_FILTER_TEXT.overPowerMin,
  maxLabel: RANGE_FILTER_TEXT.overPowerMax,
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
  title: RANGE_FILTER_TEXT.singleRating,
  minLabel: RANGE_FILTER_TEXT.singleRatingMin,
  maxLabel: RANGE_FILTER_TEXT.singleRatingMax,
  min: SINGLE_RATING_MIN,
  max: SINGLE_RATING_MAX,
  step: 0.01,
  allowedInput: /[0-9.]/,
  inputMode: 'decimal',
  pattern: '[0-9]*\\.?[0-9]*',
}
