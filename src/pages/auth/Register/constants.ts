import { DOCUMENTATION_BASE_URL } from '../../../config'

const DOCUMENTATION_URL = DOCUMENTATION_BASE_URL.replace(/\/$/, '')

/** 利用規約の公開URL */
export const TERMS_URL = `${DOCUMENTATION_URL}/legal/terms/`
/** プライバシーポリシーの公開URL */
export const PRIVACY_POLICY_URL = `${DOCUMENTATION_URL}/legal/privacy/`

/** 登録済みのアカウントで認証した場合に表示するメッセージ */
export const REGISTERED_ACCOUNT_MESSAGE =
  'このアカウントはすでに登録済みです。ログイン画面からログインしてください。'
/** 認証プロバイダでの認証に失敗した場合に表示するメッセージ */
export const PROVIDER_AUTH_ERROR_MESSAGE = '認証に失敗しました。'

/**
 * 認証プロバイダで新規登録を始めるボタンの文言を作る。
 *
 * @param label - 認証プロバイダの表示名。
 * @returns 新規登録ボタンの文言。
 */
export const providerContinueButtonLabel = (label: string): string => `${label}で続ける`

/**
 * 認証済みのアカウント欄の見出しを作る。
 *
 * @param label - 認証プロバイダの表示名。
 * @returns アカウント欄の見出し。
 */
export const authAccountHeading = (label: string): string => `${label}アカウント:`
/** Turnstileの検証が完了していない場合に表示するメッセージ */
export const TURNSTILE_REQUIRED_MESSAGE = '認証確認を完了してから登録してください。'
/** Turnstileの検証に失敗した場合に表示するメッセージ */
export const TURNSTILE_ERROR_MESSAGE =
  '認証確認に失敗しました。しばらく待ってから再度お試しください。'

/** ユーザー名が登録禁止語に該当しないことを示す入力条件 */
export const USERNAME_FORBIDDEN_WORD_REQUIREMENT = '登録禁止語に該当しないもの'
