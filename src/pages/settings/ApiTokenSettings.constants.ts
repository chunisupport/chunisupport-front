import type { ApiTokenPermission } from '../../types/api'

/** APIが許可するAPIトークン名の最大文字数 */
export const API_TOKEN_NAME_MAX_LENGTH = 50

/** 1ユーザーが所有できるAPIトークンの最大件数 */
export const API_TOKEN_MAX_COUNT = 10

/** APIトークン発行時に選択できる権限 */
export const API_TOKEN_PERMISSION_OPTIONS: readonly {
  value: ApiTokenPermission
  label: string
  description: string
}[] = [
  {
    value: 'read',
    label: '読み取り',
    description: '参照系APIのみ利用できます。',
  },
  {
    value: 'read_write',
    label: '読み取り・書き込み',
    description: '参照系・更新系APIを利用できます。更新系APIにはEDITORまたはADMIN権限も必要です。',
  },
]

/**
 * APIトークン権限の表示名を返す。
 *
 * @param permission - APIが返したAPIトークン権限。
 * @returns 設定画面で表示する権限名。
 */
export const formatApiTokenPermission = (permission: ApiTokenPermission): string =>
  API_TOKEN_PERMISSION_OPTIONS.find((option) => option.value === permission)?.label ?? permission

/** APIトークン設定欄で使用する表示文言 */
export const API_TOKEN_SETTINGS_COPY = {
  title: 'APIトークン管理',
  description: '外部連携用の名前付きAPIトークンを管理します。',
  issueLabel: '新しいAPIトークン名',
  issuePlaceholder: '例: Discord Bot',
  issueDialogTitle: 'APIトークンを発行',
  issueDialogDescription: '名前と権限を指定します。権限は発行後に変更できません。',
  issueReadOnlyDialogDescription: '名前を指定します。権限は読み取り専用で発行されます。',
  permissionLabel: '権限',
  issueButton: 'APIトークンを発行',
  startIssueButton: '新しいトークンを発行',
  cancelIssueButton: 'キャンセル',
  nameValidationError: '前後空白を除いて1〜50文字で入力してください。',
  issueSuccess: 'APIトークンを発行しました。トークン文字列の表示はこの1回のみです。',
  issueFailure: 'APIトークン発行に失敗しました。',
  empty: '現在有効なAPIトークンはありません。',
  tableCaption: '有効なAPIトークン一覧',
  nameLabel: '名前',
  prefixLabel: '識別子',
  createdAtLabel: '発行日時',
  lastUsedAtLabel: '最終利用',
  permissionValueLabel: '権限',
  actionsLabel: '操作',
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
