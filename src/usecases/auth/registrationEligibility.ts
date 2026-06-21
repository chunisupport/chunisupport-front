export type GoogleRegistrationEligibility = 'available' | 'registered'
export type FetchCurrentUserForRegistration = () => Promise<unknown>

/**
 * APIエラーがバックエンド未登録ユーザーを表すか判定する。
 *
 * `/internal/me` や `/internal/auth/login` は、Firebase認証は成功したが
 * アプリ内ユーザーが未作成の場合に `invalid_token` を返す。
 *
 * @param error - fetchWithAuth が送出した可能性のあるエラー。
 * @returns 未登録ユーザー由来のエラーの場合はtrue。
 */
const isUnregisteredUserError = (error: unknown): boolean => {
  const apiError = error as Partial<{ code: string }>
  return apiError.code === 'user_not_found' || apiError.code === 'invalid_token'
}

/**
 * Google認証済みユーザーが新規登録可能か判定する。
 *
 * @param fetchCurrentUser - 現在のGoogle認証ユーザーに紐づくバックエンドユーザーを取得する関数。
 * @returns 未登録ならavailable、既存アカウントがあればregistered。
 */
export const resolveGoogleRegistrationEligibility = async (
  fetchCurrentUser: FetchCurrentUserForRegistration
): Promise<GoogleRegistrationEligibility> => {
  try {
    await fetchCurrentUser()
    return 'registered'
  } catch (error) {
    if (isUnregisteredUserError(error)) {
      return 'available'
    }

    throw error
  }
}
