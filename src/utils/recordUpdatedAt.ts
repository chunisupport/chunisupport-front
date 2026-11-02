import { toRecordDateString } from './dateFilter'

/**
 * レコード更新日時を日本時間基準の年2桁の日付表示へ整形する。
 *
 * @param updatedAt - ISO 8601形式の更新日時。未設定の場合はnull。
 * @returns `YY/MM/DD` 形式の日付。不正または未設定の場合はハイフン。
 */
export const formatUpdatedAt = (updatedAt: string | null): string => {
  const recordDate = toRecordDateString(updatedAt)
  if (!recordDate) {
    return '-'
  }

  const [year, month, day] = recordDate.split('-')
  return `${year.slice(-2)}/${month}/${day}`
}

/**
 * レコード更新日時をソート用タイムスタンプへ変換する。
 *
 * @param updatedAt - ISO 8601形式の更新日時。未設定の場合はnull。
 * @returns 更新日時のタイムスタンプ。不正または未設定の場合は負の無限大。
 */
export const updatedAtTimestamp = (updatedAt: string | null): number => {
  if (!updatedAt) {
    return Number.NEGATIVE_INFINITY
  }

  const ts = Date.parse(updatedAt)
  return Number.isNaN(ts) ? Number.NEGATIVE_INFINITY : ts
}

/**
 * 更新日時のソート値が有効か判定する。
 *
 * @param timestamp - 判定対象のタイムスタンプ。
 * @returns 有効な更新日時ならtrue。
 */
export const hasValidUpdatedAtTimestamp = (timestamp: number): boolean => {
  return timestamp !== Number.NEGATIVE_INFINITY
}

/** 更新日ソートに必要なプレイ状態とタイムスタンプ */
export type UpdatedAtSortable = {
  isPlayed: boolean
  updatedAtTimestamp: number
}

/**
 * レコード更新日を昇順比較し、未プレイまたは日時なしを末尾へ送る。
 *
 * @param left - 左側の更新日ソート値。
 * @param right - 右側の更新日ソート値。
 * @returns 左が先なら負数、右が先なら正数、同順位なら0。
 */
export const compareUpdatedAtWithMissingLast = (
  left: UpdatedAtSortable,
  right: UpdatedAtSortable
): number => {
  const leftMissing = !left.isPlayed || !hasValidUpdatedAtTimestamp(left.updatedAtTimestamp)
  const rightMissing = !right.isPlayed || !hasValidUpdatedAtTimestamp(right.updatedAtTimestamp)

  if (leftMissing && rightMissing) {
    return 0
  }

  if (leftMissing) {
    return 1
  }

  if (rightMissing) {
    return -1
  }

  return left.updatedAtTimestamp === right.updatedAtTimestamp
    ? 0
    : left.updatedAtTimestamp - right.updatedAtTimestamp
}
