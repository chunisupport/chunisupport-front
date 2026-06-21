/**
 * 件数目標の入力値を保存・プレビューで使う目標件数へ変換する。
 *
 * @param countMode - 件数の指定方法。
 * @param countValue - 件数入力欄の文字列。
 * @returns 動的上限を使う場合はundefined、固定件数の場合はAPIへ渡す目標件数。
 */
export const buildTargetCountParam = (
  countMode: 'number' | 'all',
  countValue: string
): number | undefined => {
  if (countMode === 'all') return undefined

  const parsedCount = Number(countValue)
  const normalizedCount = Number.isFinite(parsedCount) ? Math.floor(parsedCount) : 0
  return normalizedCount
}
