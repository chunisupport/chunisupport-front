/** スタッフログイン画面の文言 */
export const STAFF_LOGIN_COPY = {
  title: 'スタッフログイン',
  notice: 'スタッフ向けログイン画面です。ここからのログインはできません',
  normalLogin: '通常のログイン画面へ',
  email: 'メールアドレス',
  password: 'パスワード',
  submit: 'ログイン',
  submitting: '処理中...',
  error: 'ログインに失敗しました。',
  unregistered: 'このアカウントはChuniSupportに登録されていません。',
} as const

/** 認証情報入力欄の共通スタイル */
export const STAFF_LOGIN_INPUT_CLASS =
  'w-full rounded-md border border-border-strong bg-surface px-3 py-2 font-sans outline-none focus:ring-2 focus:ring-inset focus:ring-focus-ring'
