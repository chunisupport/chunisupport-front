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
  currentLabel: '現在',
  targetLabel: '変更先',
  select: '変更先を選択',
  selecting: '選択中...',
  submit: '変更する',
  submitting: '変更中...',
  cancel: 'キャンセル',
  success: 'Googleアカウントを変更しました。',
  failure: 'Googleアカウントの変更に失敗しました。',
  selectionClosed: 'Googleアカウントの選択がキャンセルされました。',
  popupClosed: '再認証がキャンセルされました。',
  userMismatch: '現在のGoogleアカウントで再認証してください。',
  recentSignInExpired: '有効期限が切れました。変更先をもう一度選択してください。',
} as const

/** 退会確認ダイアログで使用する表示文言。 */
export const ACCOUNT_DELETE_COPY = {
  title: '本当に退会しますか？',
  description:
    'ユーザー情報、プレイヤーデータ、目標、APIトークンがすべて削除されます。本人確認のため再認証が必要です。',
  cancel: 'キャンセル',
  confirm: '退会する',
  deleting: '処理中...',
} as const
