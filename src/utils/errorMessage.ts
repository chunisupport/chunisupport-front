import { type ErrorCode, errorMessages } from '../types/api'

const DEFAULT_USER_FRIENDLY_ERROR_MESSAGE =
  '予期せぬエラーが発生しました。時間をおいて再度お試しください。'

const FIREBASE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/account-exists-with-different-credential':
    'このGoogleアカウントは別の認証方法ですでに使用されています。',
  'auth/cancelled-popup-request': 'Google認証がキャンセルされました。もう一度お試しください。',
  'auth/credential-already-in-use': 'このGoogleアカウントはすでに使用されています。',
  'auth/email-already-in-use': 'このメールアドレスはすでに使用されています。',
  'auth/internal-error': DEFAULT_USER_FRIENDLY_ERROR_MESSAGE,
  'auth/invalid-credential': '認証情報が無効です。もう一度ログインしてください。',
  'auth/network-request-failed':
    '通信に失敗しました。ネットワーク接続を確認してもう一度お試しください。',
  'auth/operation-not-allowed': 'この認証方法は現在利用できません。',
  'auth/popup-blocked': 'ポップアップがブロックされました。ブラウザの設定を確認してください。',
  'auth/popup-closed-by-user': 'Google認証がキャンセルされました。',
  'auth/requires-recent-login': '再認証が必要です。もう一度Googleログインを行ってください。',
  'auth/too-many-requests': 'リクエストが多すぎます。しばらく待ってから再試行してください。',
  'auth/user-disabled': 'このアカウントは利用できません。',
  'auth/user-mismatch': 'ログイン中のアカウントと異なるアカウントで再認証されました。',
}

const STATUS_ERROR_MESSAGES: Record<number, string> = {
  400: errorMessages.bad_request,
  401: errorMessages.unauthorized,
  403: errorMessages.forbidden,
  404: errorMessages.not_found,
  409: errorMessages.conflict,
  413: errorMessages.payload_too_large,
  429: errorMessages.too_many_requests,
  503: errorMessages.service_unavailable,
}

type ErrorLike = {
  code?: unknown
  status?: unknown
  error?: {
    code?: unknown
    status?: unknown
  }
}

/**
 * unknown の値から表示用メッセージ判定に必要なエラー情報を取り出す。
 *
 * @param error - 判定対象のエラー値。
 * @returns code/status を持つ可能性がある値。オブジェクト以外は null。
 */
const toErrorLike = (error: unknown): ErrorLike | null =>
  typeof error === 'object' && error !== null ? (error as ErrorLike) : null

/**
 * APIエラーコードに対応するユーザー向けメッセージを取得する。
 *
 * @param code - APIまたはFirebaseから返された可能性があるエラーコード。
 * @returns 対応するユーザー向けメッセージ。未対応の場合は null。
 */
const resolveCodeMessage = (code: unknown): string | null => {
  if (typeof code !== 'string') return null
  if (code in errorMessages) return errorMessages[code as ErrorCode]
  return FIREBASE_AUTH_ERROR_MESSAGES[code] ?? null
}

/**
 * HTTPステータスに対応するユーザー向けメッセージを取得する。
 *
 * @param status - APIエラーやレスポンスに含まれるHTTPステータス。
 * @returns 対応するユーザー向けメッセージ。未対応の場合は null。
 */
const resolveStatusMessage = (status: unknown): string | null => {
  if (typeof status !== 'number') return null
  if (status >= 500) return errorMessages.service_unavailable
  return STATUS_ERROR_MESSAGES[status] ?? null
}

/**
 * 内部エラーの詳細を露出しないユーザー向けメッセージへ変換する。
 *
 * @param error - catch や ErrorBoundary で受け取った任意のエラー値。
 * @param fallbackMessage - エラー種別を特定できない場合に表示する文言。
 * @returns ユーザー向けに安全なエラーメッセージ。
 */
export const toUserFriendlyErrorMessage = (
  error: unknown,
  fallbackMessage = DEFAULT_USER_FRIENDLY_ERROR_MESSAGE
): string => {
  const errorLike = toErrorLike(error)
  if (!errorLike) return fallbackMessage

  return (
    resolveCodeMessage(errorLike.code) ??
    resolveCodeMessage(errorLike.error?.code) ??
    resolveStatusMessage(errorLike.status) ??
    resolveStatusMessage(errorLike.error?.status) ??
    fallbackMessage
  )
}
