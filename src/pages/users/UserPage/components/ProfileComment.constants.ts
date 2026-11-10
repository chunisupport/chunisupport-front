/** プロフィールカード下のコメント表示と編集ダイアログで使う固定文言 */
export const PROFILE_COMMENT_COPY = {
  add: 'コメントを追加',
  edit: 'コメントを編集',
  dialogTitle: 'コメント',
  close: '閉じる',
  cancel: 'キャンセル',
  save: '保存',
  saving: '保存中',
  saved: 'コメントを保存しました。',
  failure: 'コメントの保存に失敗しました。',
} as const

/** コメント入力欄の表示行数 */
export const PROFILE_COMMENT_INPUT_ROWS = 4

/** IME の変換中に発火した keydown が持つ keyCode。変換確定の Enter を見分けるために使う */
export const IME_COMPOSITION_KEY_CODE = 229
