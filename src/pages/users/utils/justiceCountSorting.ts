type JusticeCountMissingRecord = {
  is_played: boolean
  score: number
}

/**
 * J数ソートで表示可能なJ数がない値かどうかを判定する。
 *
 * @param justiceCount 表示・ソート用に整形済みのJ数。
 * @returns J数がない扱いにする場合はtrue。
 */
export const isJusticeCountMissing = (justiceCount: number | '' | '-'): justiceCount is '' | '-' =>
  justiceCount === '' || justiceCount === '-'

/**
 * J数がないレコード同士を既プレイ優先、スコア降順で比較する。
 *
 * @param left 比較対象の左側レコード。
 * @param right 比較対象の右側レコード。
 * @returns 左側を先に並べる場合は負数、右側を先に並べる場合は正数、同順の場合は0。
 */
export const compareMissingJusticeCountRecords = (
  left: JusticeCountMissingRecord,
  right: JusticeCountMissingRecord
): number => {
  if (left.is_played !== right.is_played) {
    return left.is_played ? -1 : 1
  }

  return right.score - left.score
}
