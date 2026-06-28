/** 最大値を基準にした目標値の指定方法。 */
export type GoalTargetMode = 'all' | 'number' | 'remaining' | 'percent'

type GoalAbsoluteTargetParam<TAbsoluteKey extends 'count' | 'total'> = TAbsoluteKey extends 'count'
  ? { count: number }
  : { total: number }

/** APIへ送る目標値パラメータ。 */
export type GoalTargetParam<TAbsoluteKey extends 'count' | 'total' = 'count' | 'total'> =
  | GoalAbsoluteTargetParam<TAbsoluteKey>
  | { remaining: number }
  | { percent: number }
  | Record<string, never>

type GoalTargetParamKey = 'score' | 'count' | 'total' | 'remaining' | 'percent'
type GoalTargetParamValue = Partial<Record<GoalTargetParamKey, unknown>>

/**
 * 目標値の指定方法と入力値をAPIパラメータへ変換する。
 *
 * @param mode - 目標値の指定方法。
 * @param value - 目標値入力欄の文字列。
 * @param absoluteKey - 絶対値指定時に使うAPIキー。
 * @returns 選択された指定方法に対応する相互排他的なAPIパラメータ。
 */
export function buildGoalTargetParam(
  mode: GoalTargetMode,
  value: string,
  absoluteKey: 'count'
): GoalTargetParam<'count'>
export function buildGoalTargetParam(
  mode: GoalTargetMode,
  value: string,
  absoluteKey: 'total'
): GoalTargetParam<'total'>
export function buildGoalTargetParam(
  mode: GoalTargetMode,
  value: string,
  absoluteKey: 'count' | 'total'
): GoalTargetParam {
  if (mode === 'all') return {}

  const parsedValue = Number(value)
  const normalizedValue = Number.isFinite(parsedValue) ? parsedValue : 0
  if (mode === 'remaining') return { remaining: normalizedValue }
  if (mode === 'percent') return { percent: normalizedValue }
  return absoluteKey === 'count'
    ? { count: Math.floor(normalizedValue) }
    : { total: normalizedValue }
}

/**
 * 成果パラメータから有効な数値を取り出す。
 *
 * @param params - 目標種別ごとの成果パラメータ。
 * @param key - 取り出すパラメータ名。
 * @returns 数値が設定されていればその値、未指定なら0。
 */
export const getNumberGoalTargetParam = (
  params: GoalTargetParamValue,
  key: GoalTargetParamKey
): number => {
  const value = params[key]
  return typeof value === 'number' ? value : 0
}

/**
 * 最大値を基準に相互排他的な目標値指定を実際の目標値へ変換する。
 *
 * @param params - APIから受け取った成果パラメータ。
 * @param maxValue - 対象条件から算出した最大値。
 * @param absoluteKey - 絶対値指定に使うキー。
 * @returns 絶対値、残数、割合、または最大値から解決した目標値。
 */
export const resolveGoalDynamicTarget = (
  params: GoalTargetParamValue,
  maxValue: number,
  absoluteKey: 'count' | 'total'
): number => {
  const absoluteValue = getNumberGoalTargetParam(params, absoluteKey)
  if (absoluteValue > 0 || params[absoluteKey] === 0) {
    return absoluteValue
  }
  const remaining = params.remaining
  if (typeof remaining === 'number') return Math.max(maxValue - remaining, 0)
  const percent = params.percent
  if (typeof percent === 'number') return (maxValue * percent) / 100
  return maxValue
}
