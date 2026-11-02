/**
 * J数ソートで表示可能なJ数がない値かどうかを判定する。
 *
 * @param justiceCount 表示・ソート用に整形済みのJ数。
 * @returns J数がない扱いにする場合はtrue。
 */
export const isJusticeCountMissing = (justiceCount: number | '' | '-'): justiceCount is '' | '-' =>
  justiceCount === '' || justiceCount === '-'
