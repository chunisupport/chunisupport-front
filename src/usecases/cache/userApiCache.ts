import { fetchSongsUpdatedAt } from '../../api/songs'
import { fetchMe, fetchUserUpdatedAt } from '../../api/users'
import { getAuthenticatedUser, getAuthStatus } from '../../stores/authSession'
import { resolveAuthSession } from '../auth/resolveAuthSession'

export type UserApiCacheTimestamps = {
  userUpdatedAt: string | null
  songsUpdatedAt: string | null
}

/**
 * 表示対象ユーザーがログインユーザー本人か判定する。
 *
 * @param username - 表示対象ユーザー名。
 * @returns ログインユーザー本人の場合は true。
 */
export const isAuthenticatedOwnUser = async (username: string): Promise<boolean> => {
  if (getAuthenticatedUser()?.username === username) {
    return true
  }

  const authStatus = getAuthStatus()
  if (authStatus === 'unknown' || authStatus === 'error') {
    await resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false }))
  }

  return getAuthenticatedUser()?.username === username
}

/**
 * ユーザー API キャッシュ判定に必要な更新日時を取得する。
 *
 * @param username - 更新日時を取得するユーザー名。
 * @returns ユーザー更新日時と楽曲更新日時。
 */
export const fetchUserApiCacheTimestamps = async (
  username: string
): Promise<UserApiCacheTimestamps> => {
  const [userUpdatedAt, songsUpdatedAt] = await Promise.all([
    fetchUserUpdatedAt(username),
    fetchSongsUpdatedAt(),
  ])

  return {
    userUpdatedAt: userUpdatedAt.updated_at,
    songsUpdatedAt: songsUpdatedAt.updated_at,
  }
}
