/** アカウント設定のユーザー名変更欄で使用する表示文言。 */
export const USERNAME_CHANGE_COPY = {
  title: 'ユーザーIDを変更',
  label: '新しいユーザーID',
  placeholder: 'newuserid',
  formatHint: '5〜50文字の小文字英数字',
  submit: '変更する',
  submitting: '変更中...',
  required: 'ユーザーIDを入力してください。',
  invalid: '5〜50文字の小文字英数字で入力してください。',
  unchanged: '現在と異なるユーザーIDを入力してください。',
  success: 'ユーザーIDを変更しました。',
  failure: 'ユーザーIDの変更に失敗しました。',
  popupClosed: '再認証がキャンセルされました。',
  userMismatch: 'ログイン中のアカウントと異なるアカウントで再認証されました。',
  recentSignInExpired: '再認証の有効期限が切れています。もう一度お試しください。',
} as const
