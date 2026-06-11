type ItemWithAddedDate = {
  created_at?: string | null
}

/**
 * 追加日時を比較用のタイムスタンプへ変換する。
 *
 * @param value APIから返された追加日時
 * @returns 有効な日時の場合はタイムスタンプ、未設定または不正な日時の場合は null
 */
const toAddedDateTimestamp = (value: string | null | undefined): number | null => {
  if (!value) return null

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

/**
 * 楽曲一覧を追加日の降順に並び替える。
 * 追加日が存在しない楽曲は先頭に配置する。
 *
 * @param items 追加日時を持つ楽曲一覧
 * @returns 追加日未設定を先頭、以降を追加日の降順にした新しい配列
 */
export const sortByAddedDateDescWithMissingFirst = <T extends ItemWithAddedDate>(
  items: T[]
): T[] => {
  return [...items].sort((left, right) => {
    const leftTimestamp = toAddedDateTimestamp(left.created_at)
    const rightTimestamp = toAddedDateTimestamp(right.created_at)

    if (leftTimestamp === null && rightTimestamp === null) return 0
    if (leftTimestamp === null) return -1
    if (rightTimestamp === null) return 1

    return rightTimestamp - leftTimestamp
  })
}
