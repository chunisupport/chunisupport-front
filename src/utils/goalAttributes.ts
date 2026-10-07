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

/**
 * 単一コードまたはコード配列で保持された目標属性の楽曲名順フォルダを配列へ正規化する。
 *
 * @param value - 目標属性に保存された楽曲名順フォルダのコード。
 * @returns 未指定なら undefined、指定ありならコード配列。
 */
export const normalizeGoalNameFolderCodes = (
  value: string | string[] | undefined
): string[] | undefined => {
  if (typeof value === 'string') return [value]
  return value
}

/**
 * 楽曲の楽曲名順フォルダが目標属性の条件に一致するか判定する。
 *
 * @param nameFolderCode - 楽曲の楽曲名順フォルダのコード。楽曲が解決できない場合は undefined。
 * @param nameFolderCodes - 正規化済みの対象コード。未指定なら undefined。
 * @returns 条件未指定、または楽曲のコードが対象に含まれる場合は true。
 */
export const isGoalNameFolderMatched = (
  nameFolderCode: string | undefined,
  nameFolderCodes: readonly string[] | undefined
): boolean =>
  !nameFolderCodes || (nameFolderCode !== undefined && nameFolderCodes.includes(nameFolderCode))
