/** APIが許可するAPIトークン名の最大文字数 */
export const API_TOKEN_NAME_MAX_LENGTH = 50

/** 1ユーザーが所有できるAPIトークンの最大件数 */
export const API_TOKEN_MAX_COUNT = 10

/** 外部連携APIの仕様書 */
export const API_DOCUMENTATION_URL =
  'https://github.com/chunisupport/chunisupport-api/blob/develop/docs/API.md'

/** APIトークン設定欄で使用する表示文言 */
export const API_TOKEN_SETTINGS_COPY = {
  title: 'APIトークン管理',
  description: '外部連携用の名前付きAPIトークンを管理します。',
  issueLabel: '新しいAPIトークン名',
  issuePlaceholder: '例: Discord Bot',
  issueButton: 'APIトークンを発行',
  startIssueButton: '新しいトークンを発行',
  cancelIssueButton: 'キャンセル',
  documentationLink: 'APIドキュメントを開く',
  nameValidationError: '前後空白を除いて1〜50文字で入力してください。',
  issueSuccess: 'APIトークンを発行しました。トークン文字列の表示はこの1回のみです。',
  issueFailure: 'APIトークン発行に失敗しました。',
  empty: '現在有効なAPIトークンはありません。',
  countUnit: '個',
  prefixLabel: '識別子',
  createdAtLabel: '発行日時',
  lastUsedAtLabel: '最終利用',
  generatedTitle: '発行されたAPIトークン',
  generatedNotice: 'この画面を離れると再表示できません。',
  copy: 'コピー',
  copied: 'コピーしました',
  copyFailure: 'コピーに失敗しました。手動でコピーしてください。',
  rename: '名前変更',
  renameAriaLabelSuffix: 'の名前を変更',
  renameLabel: '新しいAPIトークン名',
  save: '保存',
  saveAriaLabelSuffix: 'の名前を保存',
  cancel: 'キャンセル',
  cancelAriaLabelSuffix: 'の名前変更をキャンセル',
  renameSuccess: 'APIトークン名を変更しました。',
  renameFailure: 'APIトークン名の変更に失敗しました。',
  delete: '削除',
  deleteAriaLabelSuffix: 'を削除',
  deleteConfirmationSuffix: 'を削除します。よろしいですか？',
  deleteSuccess: 'APIトークンを削除しました。',
  deleteFailure: 'APIトークン削除に失敗しました。',
  migratedPrefix: '旧仕様から移行',
  unused: '未使用',
} as const
