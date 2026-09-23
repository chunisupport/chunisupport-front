/**
 * カード件数と列数から、仮想化するグリッドの行数を求める。
 *
 * @param itemCount - 表示するカード数。
 * @param columnCount - 1行あたりの列数。
 * @returns 仮想化する行数。
 */
export const getVirtualGridRowCount = (itemCount: number, columnCount: number): number => {
  if (itemCount <= 0 || columnCount <= 0) return 0
  return Math.ceil(itemCount / columnCount)
}

/**
 * 指定した仮想行に載せる要素を切り出す。
 *
 * @param items - 表示対象の全件。
 * @param rowIndex - 0始まりの行インデックス。
 * @param columnCount - 1行あたりの列数。
 * @returns その行に並べる要素。
 */
export const getVirtualGridRowSlice = <T>(
  items: readonly T[],
  rowIndex: number,
  columnCount: number
): T[] => {
  if (columnCount <= 0 || rowIndex < 0) return []
  const start = rowIndex * columnCount
  return items.slice(start, start + columnCount)
}
