import type { UserDTO } from '../../types/api.ts'

type FetchUserProfile = (username: string) => Promise<unknown>

/**
 * 認証済みユーザーのプロフィール存在確認後に遷移先を解決する。
 *
 * @param user - 認証済みユーザー。未認証の場合はnull。
 * @param fetchUserProfile - ユーザープロフィールを取得する処理。
 * @returns ユーザーページのパス。未認証の場合はnull。
 */
export const resolveAuthenticatedRedirect = async (
  user: UserDTO | null,
  fetchUserProfile: FetchUserProfile
): Promise<string | null> => {
  if (!user) {
    return null
  }

  await fetchUserProfile(user.username)
  return `/users/${encodeURIComponent(user.username)}`
}
