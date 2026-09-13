import { SONG_CARD_COLUMN_GAP_PX, SONG_CARD_WIDTH_PX } from '../constants'

/**
 * 固定幅カードがコンテナに何列入るかを求める。
 *
 * @param width - グリッドコンテナの幅（px）。
 * @returns 1列以上の列数。
 */
export const resolveSongCardColumnCount = (width: number): number => {
  const columnUnit = SONG_CARD_WIDTH_PX + SONG_CARD_COLUMN_GAP_PX
  if (width <= 0 || columnUnit <= 0) return 1
  return Math.max(1, Math.floor((width + SONG_CARD_COLUMN_GAP_PX) / columnUnit))
}

/**
 * カード件数と列数から仮想行数を求める。
 *
 * @param itemCount - 表示するカード数。
 * @param columnCount - 1行あたりの列数。
 * @returns 仮想化する行数。
 */
export const getSongCardRowCount = (itemCount: number, columnCount: number): number => {
  if (itemCount <= 0 || columnCount <= 0) return 0
  return Math.ceil(itemCount / columnCount)
}

/**
 * 指定した仮想行に載せるカードを切り出す。
 *
 * @param items - 表示対象の全件。
 * @param rowIndex - 0始まりの行インデックス。
 * @param columnCount - 1行あたりの列数。
 * @returns その行に並べる要素。
 */
export const getSongCardRowSlice = <T>(
  items: readonly T[],
  rowIndex: number,
  columnCount: number
): T[] => {
  if (columnCount <= 0 || rowIndex < 0) return []
  const start = rowIndex * columnCount
  return items.slice(start, start + columnCount)
}
