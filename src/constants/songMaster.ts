/** 楽曲マスタ編集フォームの入力上限 */
export const SONG_EDIT_INPUT_LIMITS = {
  notesDesigner: 100,
  wikiPageTitle: 300,
} as const

/** 楽曲 CRUD 成功後の正規データ再取得に失敗した場合の表示文言 */
export const SONG_DATA_REFRESH_ERROR_MESSAGE =
  '操作は完了しましたが、最新の楽曲データを取得できませんでした。再読み込みしてください。'

/** 楽曲更新日時をメモリ上で再利用する期間（5分）。経過後は API で再検証する */
export const SONGS_UPDATED_AT_CACHE_TTL_MS = 5 * 60 * 1_000
