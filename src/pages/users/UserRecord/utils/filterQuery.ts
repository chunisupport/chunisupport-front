import { CHART_CONST_MAX, CHART_CONST_MIN, SCORE_MIN } from '../../../../constants/chart'
import type { NumericRangeFilter } from '../../../../types/record'
import { MAX_SCORE } from '../../../../utils/scoreRank'
import { JUSTICE_COUNT_RANGE_FILTER, OVER_POWER_RANGE_FILTER } from '../../constants/rangeFilters'
import type { FilterState } from '../types/types'

export type FilterRangeQuery = {
  constMin?: string
  constMax?: string
  scoreMin?: string
  scoreMax?: string
  justiceCountMin?: string
  justiceCountMax?: string
  overPowerMin?: string
  overPowerMax?: string
}

type RangeQueryValue = string | string[] | undefined

type FilterRangeQuerySource = {
  [key in keyof FilterRangeQuery]?: RangeQueryValue
}

/**
 * URLクエリ用に範囲フィルターをフラットな値へ変換する。
 *
 * @param filter - 変換元の内部フィルター状態。
 * @returns URLSearchParamsへ渡せる範囲フィルタークエリ。
 */
export function serializeFilterRangeQuery(filter: FilterState): FilterRangeQuery {
  return {
    constMin: filter.const.min === CHART_CONST_MIN ? undefined : String(filter.const.min),
    constMax: filter.const.max === CHART_CONST_MAX ? undefined : String(filter.const.max),
    scoreMin: filter.score.min === SCORE_MIN ? undefined : String(filter.score.min),
    scoreMax: filter.score.max === MAX_SCORE ? undefined : String(filter.score.max),
    justiceCountMin: filter.justiceCount.min === null ? undefined : String(filter.justiceCount.min),
    justiceCountMax: filter.justiceCount.max === null ? undefined : String(filter.justiceCount.max),
    overPowerMin: filter.overPower.min === null ? undefined : String(filter.overPower.min),
    overPowerMax: filter.overPower.max === null ? undefined : String(filter.overPower.max),
  }
}

/**
 * URLクエリ用にスコア範囲をフラットな値へ変換する。
 *
 * @param filter - 変換元の内部フィルター状態。
 * @returns URLSearchParamsへ渡せるスコア範囲クエリ。
 */
export function serializeScoreRangeQuery(
  filter: FilterState
): Pick<FilterRangeQuery, 'scoreMin' | 'scoreMax'> {
  const query = serializeFilterRangeQuery(filter)
  return {
    scoreMin: query.scoreMin,
    scoreMax: query.scoreMax,
  }
}

/**
 * フラットなURLクエリから範囲フィルターを復元する。
 *
 * @param query - URLクエリ由来の範囲フィルター。
 * @param fallback - クエリが不正な場合に使う内部フィルター状態。
 * @returns 内部フィルターで扱う範囲フィルター。
 */
export function parseFilterRangeQuery(
  query: FilterRangeQuerySource,
  fallback: FilterState
): Pick<FilterState, 'const' | 'score' | 'justiceCount' | 'overPower'> {
  return {
    const: {
      min: parseNumberRangeQueryValue(query.constMin, fallback.const.min, {
        min: CHART_CONST_MIN,
        max: CHART_CONST_MAX,
      }),
      max: parseNumberRangeQueryValue(query.constMax, fallback.const.max, {
        min: CHART_CONST_MIN,
        max: CHART_CONST_MAX,
      }),
    },
    score: parseScoreRangeQuery(query, fallback.score),
    justiceCount: {
      min: parseNullableNumberRangeQueryValue(query.justiceCountMin, fallback.justiceCount.min, {
        min: JUSTICE_COUNT_RANGE_FILTER.min,
        max: JUSTICE_COUNT_RANGE_FILTER.max,
        integer: true,
      }),
      max: parseNullableNumberRangeQueryValue(query.justiceCountMax, fallback.justiceCount.max, {
        min: JUSTICE_COUNT_RANGE_FILTER.min,
        max: JUSTICE_COUNT_RANGE_FILTER.max,
        integer: true,
      }),
    },
    overPower: {
      min: parseNullableNumberRangeQueryValue(query.overPowerMin, fallback.overPower.min, {
        min: OVER_POWER_RANGE_FILTER.min,
        max: OVER_POWER_RANGE_FILTER.max,
        decimalPlaces: 3,
      }),
      max: parseNullableNumberRangeQueryValue(query.overPowerMax, fallback.overPower.max, {
        min: OVER_POWER_RANGE_FILTER.min,
        max: OVER_POWER_RANGE_FILTER.max,
        decimalPlaces: 3,
      }),
    },
  }
}

/**
 * フラットなURLクエリからスコア範囲を復元する。
 *
 * @param query - URLクエリ由来のスコア範囲。
 * @param fallback - クエリが不正な場合に使う内部スコア範囲。
 * @returns 内部フィルターで扱うスコア範囲。
 */
export function parseScoreRangeQuery(
  query: FilterRangeQuerySource,
  fallback: NumericRangeFilter
): NumericRangeFilter {
  return {
    min: parseNumberRangeQueryValue(query.scoreMin, fallback.min, {
      min: SCORE_MIN,
      max: MAX_SCORE,
    }),
    max: parseNumberRangeQueryValue(query.scoreMax, fallback.max, {
      min: SCORE_MIN,
      max: MAX_SCORE,
    }),
  }
}

type RangeQueryOptions = {
  min: number
  max: number
  integer?: boolean
  decimalPlaces?: number
}

/**
 * URLクエリの単一値を数値範囲の値へ変換する。
 *
 * @param value - URLクエリから取得した値。
 * @param fallback - 値が不正な場合に返す値。
 * @param options - 許可範囲、整数指定、小数桁数の設定。
 * @returns 有効な数値範囲の値。
 */
function parseNumberRangeQueryValue(
  value: RangeQueryValue,
  fallback: number,
  options: RangeQueryOptions
): number {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (rawValue === undefined || rawValue === '') return fallback
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed)) return fallback
  if (options.integer && !Number.isInteger(parsed)) return fallback
  const normalized = Math.max(options.min, Math.min(parsed, options.max))
  if (typeof options.decimalPlaces === 'number') {
    const factor = 10 ** options.decimalPlaces
    return Math.round(normalized * factor) / factor
  }
  return normalized
}

/**
 * URLクエリの単一値をnull許容の数値範囲値へ変換する。
 *
 * @param value - URLクエリから取得した値。
 * @param fallback - 値が不正な場合に返す値。
 * @param options - 許可範囲、整数指定、小数桁数の設定。
 * @returns 有効な数値範囲の値。未指定または不正値の場合はfallback。
 */
function parseNullableNumberRangeQueryValue(
  value: RangeQueryValue,
  fallback: number | null,
  options: RangeQueryOptions
): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (rawValue === undefined || rawValue === '') return fallback
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed)) return fallback
  if (options.integer && !Number.isInteger(parsed)) return fallback
  const normalized = Math.max(options.min, Math.min(parsed, options.max))
  if (typeof options.decimalPlaces === 'number') {
    const factor = 10 ** options.decimalPlaces
    return Math.round(normalized * factor) / factor
  }
  return normalized
}
