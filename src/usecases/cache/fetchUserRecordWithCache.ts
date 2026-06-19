import { fetchUserRecord } from '../../api/users'
import {
  readCachedUserRecord,
  saveCachedUserRecord,
} from '../../repositories/userApiCacheRepository'
import type { UserRecordDTO } from '../../types/api'
import { fetchUserApiCacheTimestamps, isAuthenticatedOwnUser } from './userApiCache'

/**
 * ログインユーザー本人の include_noplay=true レコードを IndexedDB キャッシュ判定付きで取得する。
 *
 * @param username - レコード取得対象のユーザー名。
 * @returns キャッシュ、または API から取得したレコードレスポンス。
 */
export const fetchUserRecordWithCache = async (username: string): Promise<UserRecordDTO> => {
  if (!(await isAuthenticatedOwnUser(username))) {
    return fetchUserRecord(username, { includeNoPlay: true })
  }

  let timestamps: Awaited<ReturnType<typeof fetchUserApiCacheTimestamps>>

  try {
    timestamps = await fetchUserApiCacheTimestamps(username)
  } catch {
    return fetchUserRecord(username, { includeNoPlay: true })
  }

  try {
    const cachedRecord = await readCachedUserRecord({ username, ...timestamps })
    if (cachedRecord) {
      return cachedRecord
    }
  } catch {
    return fetchUserRecord(username, { includeNoPlay: true })
  }

  const response = await fetchUserRecord(username, { includeNoPlay: true })

  try {
    await saveCachedUserRecord(
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
