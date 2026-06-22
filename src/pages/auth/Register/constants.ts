import { DOCUMENTATION_BASE_URL } from '../../../config'

const DOCUMENTATION_URL = DOCUMENTATION_BASE_URL.replace(/\/$/, '')

/** 利用規約の公開URL。 */
export const TERMS_URL = `${DOCUMENTATION_URL}/legal/terms/`
/** プライバシーポリシーの公開URL。 */
export const PRIVACY_POLICY_URL = `${DOCUMENTATION_URL}/legal/privacy/`

/** 登録済みのGoogleアカウントで認証した場合に表示するメッセージ。 */
export const REGISTERED_GOOGLE_ACCOUNT_MESSAGE =
  'このGoogleアカウントはすでに登録済みです。ログイン画面からログインしてください。'
/** Turnstileの検証が完了していない場合に表示するメッセージ。 */
export const TURNSTILE_REQUIRED_MESSAGE = '認証確認を完了してから登録してください。'
/** Turnstileの検証に失敗した場合に表示するメッセージ。 */
export const TURNSTILE_ERROR_MESSAGE =
  '認証確認に失敗しました。しばらく待ってから再度お試しください。'
