/** 最大値を基準にした目標値の指定方法。 */
export type GoalTargetMode = 'all' | 'number' | 'remaining' | 'percent'

/** APIへ送る目標値パラメータ。 */
export type GoalTargetParam =
  | { count: number }
  | { total: number }
  | { remaining: number }
  | { percent: number }
  | Record<string, never>

/**
 * 目標値の指定方法と入力値をAPIパラメータへ変換する。
 *
 * @param mode - 目標値の指定方法。
 * @param value - 目標値入力欄の文字列。
 * @param absoluteKey - 絶対値指定時に使うAPIキー。
 * @returns 選択された指定方法に対応する相互排他的なAPIパラメータ。
 */
export const buildGoalTargetParam = (
  mode: GoalTargetMode,
  value: string,
  absoluteKey: 'count' | 'total'
): GoalTargetParam => {
  if (mode === 'all') return {}

  const parsedValue = Number(value)
  const normalizedValue = Number.isFinite(parsedValue) ? parsedValue : 0
  if (mode === 'remaining') return { remaining: normalizedValue }
  if (mode === 'percent') return { percent: normalizedValue }
  return absoluteKey === 'count'
    ? { count: Math.floor(normalizedValue) }
    : { total: normalizedValue }
}
