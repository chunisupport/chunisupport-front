/**
 * 目標属性で扱う単一IDまたはID配列の保存形式。
 */
type GoalAttributeIdValue = number | number[] | undefined

/**
 * 単一値または配列で保持された目標属性IDを配列へ正規化する。
 *
 * @param value - 目標属性に保存されたID。
 * @returns 有効な整数IDの配列。
 */
export const normalizeGoalAttributeIds = (value: GoalAttributeIdValue): number[] => {
  if (typeof value === 'number') return [value]
  if (Array.isArray(value)) {
    return value.filter((id): id is number => Number.isInteger(id))
  }
  return []
}

/**
 * 目標属性が明示的な空選択として保存されているか判定する。
 *
 * @param value - 目標属性に保存されたID指定。
 * @returns 空配列が保存されていればtrue。
 */
export const isExplicitEmptyGoalAttribute = (value: GoalAttributeIdValue): boolean =>
  Array.isArray(value) && value.length === 0
