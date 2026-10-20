import type { ErrorCode } from '../../types/api'

/** アカウント設定のユーザーネーム変更欄で使用する表示文言。 */
export const USERNAME_CHANGE_COPY = {
  title: 'ユーザーネームを変更',
  label: '新しいユーザーネーム',
  placeholder: '新しいユーザーネームを入力',
  formatHint: '5〜50文字の小文字英数字',
  submit: '変更する',
  submitting: '変更中...',
  invalid: '5〜50文字の小文字英数字で入力してください。',
  unchanged: '現在と異なるユーザーネームを入力してください。',
  success: 'ユーザーネームを変更しました。',
  failure: 'ユーザーネームの変更に失敗しました。',
  popupClosed: '再認証がキャンセルされました。',
  userMismatch: 'ログイン中のアカウントと異なるアカウントで再認証されました。',
  recentSignInExpired: '再認証の有効期限が切れています。もう一度お試しください。',
} as const

/** アカウント設定のGoogleアカウント変更欄で使用する表示文言。 */
export const GOOGLE_ACCOUNT_CHANGE_COPY = {
  title: 'Googleアカウントを変更',
  stepsLabel: '変更の手順',
  steps: { select: '変更先を選択', confirm: '本人確認', done: '完了' },
  stepCompleted: '（完了済み）',
  currentLabel: '現在',
  targetLabel: '変更先',
  open: '変更する',
  cancel: 'キャンセル',
  select: '変更先を選択',
  selecting: '選択中...',
  reselect: '選び直す',
  /** 本人確認に使うアカウントを名指しして、どのアカウントで認証するかを明示する。 */
  submit: (email: string) => `${email} で本人確認して変更`,
  submitting: '変更中...',
  close: '閉じる',
  success: 'Googleアカウントを変更しました。',
  failure: 'Googleアカウントの変更に失敗しました。',
  selectionClosed: 'Googleアカウントの選択がキャンセルされました。',
  popupClosed: '再認証がキャンセルされました。',
  userMismatch: '現在のGoogleアカウントで再認証してください。',
  recentSignInExpired: '有効期限が切れました。変更先をもう一度選択してください。',
} as const

/** Googleアカウント変更で、変更先を選び直す必要があるAPIエラーコード。 */
export const GOOGLE_ACCOUNT_CHANGE_RESELECT_ERROR_CODES: ReadonlySet<string> = new Set<ErrorCode>([
  'recent_sign_in_required',
  'firebase_uid_already_linked',
  'firebase_account_unchanged',
])

/** 退会確認ダイアログで使用する表示文言。 */
export const ACCOUNT_DELETE_COPY = {
  title: '本当に退会しますか？',
  description:
    'ユーザー情報、プレイヤーデータ、目標、APIトークンがすべて削除されます。本人確認のため再認証が必要です。',
  cancel: 'キャンセル',
  confirm: '退会する',
  deleting: '処理中...',
} as const
