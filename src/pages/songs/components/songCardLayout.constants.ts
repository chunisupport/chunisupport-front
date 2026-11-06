/** カード行間の隙間（px） */
export const SONG_CARD_ROW_GAP_PX = 16

/** カード列間の隙間（px） */
export const SONG_CARD_COLUMN_GAP_PX = 16

/** 一覧ページ左右パディング合計（px） */
export const SONG_CARD_PAGE_HORIZONTAL_PADDING_PX = 32

/** FHD全幅時のメイン領域幅（px） */
export const SONG_CARD_FHD_MAIN_WIDTH_PX = 1801

/** FHD全幅時のページ本文幅（px）。p-4 内側 */
export const SONG_CARD_FHD_CONTENT_WIDTH_PX =
  SONG_CARD_FHD_MAIN_WIDTH_PX - SONG_CARD_PAGE_HORIZONTAL_PADDING_PX

/** FHD全幅時に並べるカード枚数 */
export const SONG_CARD_FHD_COLUMN_COUNT = 4

/** カード1枚の固定幅（px）。FHD本文幅で4枚になる値 */
export const SONG_CARD_WIDTH_PX =
  (SONG_CARD_FHD_CONTENT_WIDTH_PX - SONG_CARD_COLUMN_GAP_PX * (SONG_CARD_FHD_COLUMN_COUNT - 1)) /
  SONG_CARD_FHD_COLUMN_COUNT

/** ジャケット領域の高さ（px） */
export const SONG_CARD_JACKET_HEIGHT_PX = 128
/** カード下部の難易度行の高さ（px） */
export const SONG_CARD_CHART_ROW_HEIGHT_PX = 40

/** カード外枠ボーダーの上下合計（px）。border-box のため内容領域から差し引かれる */
export const SONG_CARD_BORDER_HEIGHT_PX = 2

/** カード1枚の高さ（px）。外枠ボーダーを含む */
export const SONG_CARD_HEIGHT_PX =
  SONG_CARD_JACKET_HEIGHT_PX + SONG_CARD_CHART_ROW_HEIGHT_PX + SONG_CARD_BORDER_HEIGHT_PX

/** 仮想行の見積もり高さ（カード高 + 行間） */
export const SONG_CARD_ROW_HEIGHT_PX = SONG_CARD_HEIGHT_PX + SONG_CARD_ROW_GAP_PX

/** 仮想化の前後に追加描画する行数 */
export const SONG_CARD_GRID_OVERSCAN = 4
