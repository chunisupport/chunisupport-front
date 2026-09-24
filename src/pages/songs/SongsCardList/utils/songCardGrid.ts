import {
  SONG_CARD_COLUMN_GAP_PX,
  SONG_CARD_PAGE_HORIZONTAL_PADDING_PX,
  SONG_CARD_WIDTH_PX,
} from '../constants'

/**
 * メイン領域からカード本文に使える幅を求める。
 *
 * @returns ページ左右パディングを除いた幅（px）。
 */
export const getAvailableSongCardWidth = (): number => {
  if (typeof document === 'undefined') return 0
  const main = document.getElementById('app-main')
  return Math.max(0, (main?.clientWidth ?? 0) - SONG_CARD_PAGE_HORIZONTAL_PADDING_PX)
}

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
 * 指定列数のカードグリッド幅を求める。
 *
 * @param columnCount - 1行あたりの列数。
 * @returns カード幅と列間を含むグリッド幅（px）。
 */
export const getSongCardGridWidth = (columnCount: number): number => {
  if (columnCount <= 0) return 0
  return columnCount * SONG_CARD_WIDTH_PX + (columnCount - 1) * SONG_CARD_COLUMN_GAP_PX
}

/**
 * 利用可能な幅に収まるカード本文幅を求める。
 *
 * @param availableWidth - ページ本文に使える幅（px）。
 * @returns グリッド幅と利用可能幅の小さい方。
 */
export const getSongCardContentWidth = (availableWidth: number): number => {
  const gridWidth = getSongCardGridWidth(resolveSongCardColumnCount(availableWidth))
  if (availableWidth <= 0) return gridWidth
  return Math.min(gridWidth, availableWidth)
}
