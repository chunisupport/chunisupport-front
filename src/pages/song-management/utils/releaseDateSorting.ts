type ItemWithReleaseDate = {
  release?: string | null
}

/**
 * リリース日を比較用のタイムスタンプへ変換する。
 *
 * @param value APIから返されたリリース日
 * @returns 有効な日付の場合はタイムスタンプ、未設定または不正な日付の場合は null
 */
const toReleaseDateTimestamp = (value: string | null | undefined): number | null => {
  if (!value) return null

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

/**
 * 楽曲一覧をリリース日の降順に並び替える。
 * リリース日が存在しない楽曲は先頭に配置する。
 *
 * @param items リリース日を持つ楽曲一覧
 * @returns リリース日未設定を先頭、以降をリリース日の降順にした新しい配列
 */
export const sortByReleaseDateDescWithMissingFirst = <T extends ItemWithReleaseDate>(
  items: T[]
): T[] => {
  return [...items].sort((left, right) => {
    const leftTimestamp = toReleaseDateTimestamp(left.release)
    const rightTimestamp = toReleaseDateTimestamp(right.release)

    if (leftTimestamp === null && rightTimestamp === null) return 0
    if (leftTimestamp === null) return -1
    if (rightTimestamp === null) return 1

    return rightTimestamp - leftTimestamp
  })
}
