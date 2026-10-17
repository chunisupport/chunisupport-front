/**
 * 未ログイン時の案内で利用する表示文言。
 */
export const LOGIN_REQUIRED_STATE_TEXT = {
  title: 'ログインが必要です',
  message: 'このツールは自分のプレイヤーデータを使います。ログインまたは新規登録してください。',
  loginLink: 'ログイン',
  registerLink: '新規登録',
} as const

/**
 * 自分のデータを使う機能だけが使えない場合の案内で利用する表示文言。
 */
export const OWN_DATA_NOTICE_TEXT = {
  unauthenticated: 'ログインすると自分のスコアを使った機能も利用できます。',
  unregistered: 'プレイヤーデータを登録すると自分のスコアを使った機能も利用できます。',
} as const
