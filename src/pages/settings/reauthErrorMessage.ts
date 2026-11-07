import { isAuthPopupClosedError, toUserFriendlyErrorMessage } from '../../utils/errorMessage'

/** 再認証で別のアカウントが選ばれたことを表すFirebaseのエラーコード。 */
const REAUTH_USER_MISMATCH_ERROR_CODE = 'auth/user-mismatch'

/** 再認証の有効期限切れを表すAPIのエラーコード。 */
const RECENT_SIGN_IN_REQUIRED_ERROR_CODE = 'recent_sign_in_required'

/** 再認証を伴う操作の失敗時に表示する文言。 */
export type ReauthErrorCopy = {
  /** 再認証でログイン中とは別のアカウントが選ばれた場合の文言 */
  readonly userMismatch: string
  /** 再認証から操作の確定までに有効期限が切れた場合の文言 */
  readonly recentSignInExpired: string
  /** エラー種別を特定できない場合の文言 */
  readonly failure: string
}

/**
 * 再認証を伴う操作のエラーを、操作欄に表示する文言へ変換する。
 * 認証ポップアップを自分で閉じた中断はエラーとして扱わない。
 *
 * @param error - 再認証または操作APIの呼び出しで捕捉したエラー。
 * @param copy - 操作ごとの表示文言。
 * @returns 表示する文言。エラーを表示しない場合は null。
 */
export const resolveReauthErrorMessage = (error: unknown, copy: ReauthErrorCopy): string | null => {
  if (isAuthPopupClosedError(error)) return null

  const code = (error as { code?: unknown } | null)?.code
  if (code === REAUTH_USER_MISMATCH_ERROR_CODE) return copy.userMismatch
  if (code === RECENT_SIGN_IN_REQUIRED_ERROR_CODE) return copy.recentSignInExpired
  return toUserFriendlyErrorMessage(error, copy.failure)
}
