import { localizedCopy, t } from '../i18n'
import { type ErrorCode, errorMessages } from '../types/api'

const FIREBASE_AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> =
  localizedCopy('firebaseAuthErrors')

/** HTTPステータスに対応するAPIエラーコード */
const STATUS_ERROR_CODES: Record<number, ErrorCode> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  413: 'payload_too_large',
  429: 'too_many_requests',
  503: 'service_unavailable',
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
  const code = STATUS_ERROR_CODES[status]
  return code ? errorMessages[code] : null
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
  fallbackMessage = t('errors.unexpected')
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
