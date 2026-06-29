/**
 * 目標属性で扱う単一IDまたはID配列の保存形式。
 */
type GoalAttributeIdValue = number | number[] | undefined

/**
 * 単一値または配列で保持された目標属性IDを条件ID配列へ正規化する。
 *
 * @param value - 目標属性に保存されたID。
 * @returns 未指定なら undefined、有効な整数ID指定なら配列。
 */
export const normalizeGoalAttributeIds = (value: GoalAttributeIdValue): number[] | undefined => {
  if (typeof value === 'number') return [value]
  if (Array.isArray(value)) {
    return value.filter((id): id is number => Number.isInteger(id))
  }
  return undefined
}
