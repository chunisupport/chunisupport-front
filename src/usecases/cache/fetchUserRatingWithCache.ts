import { fetchUserRating } from '../../api/users.ts'
import {
  readCachedUserRating,
  saveCachedUserRating,
} from '../../repositories/userApiCacheRepository.ts'
import type { UserRatingDTO } from '../../types/api.ts'
import { fetchUserApiCacheTimestamps, isAuthenticatedOwnUser } from './userApiCache.ts'

/**
 * ログインユーザー本人のレーティングを IndexedDB キャッシュ判定付きで取得する。
 *
 * @param username - レーティング取得対象のユーザー名。
 * @returns キャッシュ、または API から取得したレーティングレスポンス。
 */
export const fetchUserRatingWithCache = async (username: string): Promise<UserRatingDTO> => {
  if (!(await isAuthenticatedOwnUser(username))) {
    return fetchUserRating(username)
  }

  let timestamps: Awaited<ReturnType<typeof fetchUserApiCacheTimestamps>>

  try {
    timestamps = await fetchUserApiCacheTimestamps(username)
  } catch {
    return fetchUserRating(username)
  }

  try {
    const cachedRating = await readCachedUserRating({ username, ...timestamps })
    if (cachedRating) {
      return cachedRating
    }
  } catch {
    return fetchUserRating(username)
  }

  const response = await fetchUserRating(username)

  try {
    await saveCachedUserRating(
      username,
      timestamps.userUpdatedAt,
      timestamps.songsUpdatedAt,
      response
    )
  } catch {
    // IndexedDB への保存失敗は画面表示を止めない。
  }

  return response
}
