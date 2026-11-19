import type { ApiTokenPermission } from '../../types/api'

/** APIが許可するAPIトークン名の最大文字数 */
export const API_TOKEN_NAME_MAX_LENGTH = 50

/** 1ユーザーが所有できるAPIトークンの最大件数 */
export const API_TOKEN_MAX_COUNT = 10

/** APIトークンのコピー完了表示を出し続けるミリ秒数 */
export const API_TOKEN_COPIED_FEEDBACK_DURATION_MS = 2000

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

/**
 * APIトークン発行時に選択できる参照範囲。
 * 非公開ユーザーでも自分の非公開データを出さずに他者向けのWebサービスを作れるよう、公開ユーザーのみを先頭（推奨）に置く。
 */
export const API_TOKEN_PUBLIC_ONLY_OPTIONS: readonly {
  value: boolean
  label: string
  description: string
}[] = [
  {
    value: true,
    label: '公開ユーザーのみ（推奨）',
    description:
      '自分やフレンドを含め、非公開ユーザーのデータを取得することができません。一般に公開するWebサービスにおすすめです。',
  },
  {
    value: false,
    label: '非公開ユーザーも含む',
    description:
      '本人や相互フレンドであれば、非公開ユーザーのデータも取得できます。自分用のツールを作る場合におすすめです。',
  },
]

/**
 * APIトークンの参照範囲の表示名を返す。
 *
 * @param publicOnly - APIが返した、公開ユーザーのみ参照する設定。
 * @returns 一覧で表示する参照範囲名。
 */
export const formatApiTokenPublicOnly = (publicOnly: boolean): string =>
  publicOnly ? '公開ユーザーのみ' : '非公開ユーザーも含む'

/** APIトークン設定欄で使用する表示文言 */
export const API_TOKEN_SETTINGS_COPY = {
  title: 'APIトークン管理',
  description: '外部連携用の名前付きAPIトークンを管理します。',
  issueLabel: '新しいAPIトークン名',
  issuePlaceholder: '例: Discord Bot',
  issueDialogTitle: 'APIトークンを発行',
  issueDialogDescription:
    '名前・権限・参照範囲を指定します。権限と参照範囲は発行後に変更できず、変えるにはトークンを削除して再発行する必要があります。',
  issueReadOnlyDialogDescription:
    '名前と参照範囲を指定します。権限は読み取り専用で発行されます。参照範囲は発行後に変更できず、変えるにはトークンを削除して再発行する必要があります。',
  permissionLabel: '権限',
  publicOnlyLabel: '参照範囲',
  publicOnlyNotice:
    '「公開ユーザーのみ」のトークンでは、自分自身やフレンドであっても非公開ユーザーのデータは取得できず、404になります。chunirec互換APIで user_name を省略して自分のデータを取得する場合も、自分が非公開なら404です。',
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
  publicOnlyValueLabel: '参照範囲',
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
  deleteDialogTitle: 'APIトークンを削除しますか？',
  deleteDialogSubmit: '削除する',
  deleting: '削除中...',
  deleteSuccess: 'APIトークンを削除しました。',
  deleteFailure: 'APIトークン削除に失敗しました。',
  migratedPrefix: '旧仕様から移行',
  unused: '未使用',
} as const

/**
 * APIトークン削除の確認ダイアログに表示する対象の説明を作成する。
 *
 * @param tokenName - 削除対象のAPIトークン名。
 * @returns 確認ダイアログの説明文。
 */
export const formatApiTokenDeleteTargetMessage = (tokenName: string): string =>
  `「${tokenName}」を削除します。`
