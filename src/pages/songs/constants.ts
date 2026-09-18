/** 楽曲 CRUD 成功後の正規データ再取得に失敗した場合の表示文言 */
export const SONG_DATA_REFRESH_ERROR_MESSAGE =
  '操作は完了しましたが、最新の楽曲データを取得できませんでした。再読み込みしてください。'

/** 楽曲管理画面の操作ボタン文言 */
export const SONG_MANAGEMENT_ACTION_COPY = {
  update: '更新',
  delete: '削除',
  restore: '復活',
  addStandard: '通常楽曲を追加',
  addWorldsend: "WORLD'S END楽曲を追加",
  addUltimaChart: 'ULTIMA譜面を追加',
} as const

/** 楽曲一覧で選択できる表示形式 */
export type SongListViewMode = 'card' | 'table'

/** 楽曲一覧の初期表示形式 */
export const DEFAULT_SONG_LIST_VIEW_MODE: SongListViewMode = 'card'

/** 楽曲一覧の表示形式切り替えに使う文言 */
export const SONG_LIST_VIEW_TOGGLE_COPY = {
  toCard: 'カード表示に切り替え',
  toTable: '表表示に切り替え',
} as const
