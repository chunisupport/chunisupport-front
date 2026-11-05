/** Turnstileウィジェットの検証失敗時に表示する文言 */
export const TURNSTILE_ERROR_MESSAGE =
  '認証確認に失敗しました。しばらく待ってから再度お試しください。'

/** ログインの失敗理由を特定できない場合に表示する文言 */
export const PROVIDER_LOGIN_ERROR_MESSAGE = 'ログインに失敗しました。'

/**
 * 認証プロバイダでのログインを開始するボタンの文言を作る。
 *
 * @param label - 認証プロバイダの表示名。
 * @returns ログインボタンの文言。
 */
export const providerLoginButtonLabel = (label: string): string => `${label}でログイン`

/** ログイン処理中にボタンへ表示する文言 */
export const PROVIDER_LOGIN_SUBMITTING_LABEL = '処理中...'
