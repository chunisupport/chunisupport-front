import { fetchUserStandardSongRecord, fetchUserWorldsendSongRecord } from '../../api/users'
import {
  readCachedStandardSongRecord,
  readCachedWorldsendSongRecord,
  saveCachedStandardSongRecord,
  saveCachedWorldsendSongRecord,
} from '../../repositories/userApiCacheRepository'
import type { PlayerRecordDTO, WorldsendRecordDTO } from '../../types/api'
import { fetchUserApiCacheTimestamps, isAuthenticatedOwnUser } from './userApiCache'

/**
 * 通常楽曲1曲分のレコードをキャッシュ判定付きで取得する。
 *
 * @param username - レコード取得対象のユーザー名。
 * @param displayId - 取得対象の楽曲表示ID。
 * @returns 対象曲の通常譜面レコード。
 */
export const fetchUserStandardSongRecordWithCache = async (
  username: string,
  displayId: string
): Promise<PlayerRecordDTO[]> => {
  if (!(await isAuthenticatedOwnUser(username))) {
    const response = await fetchUserStandardSongRecord(username, displayId, {
      includeNoPlay: true,
    })
    return response.standard
  }

  let timestamps: Awaited<ReturnType<typeof fetchUserApiCacheTimestamps>>
  try {
    timestamps = await fetchUserApiCacheTimestamps(username)
  } catch {
    const response = await fetchUserStandardSongRecord(username, displayId, {
      includeNoPlay: true,
    })
    return response.standard
  }

  const match = { username, ...timestamps }
  try {
    const cached = await readCachedStandardSongRecord(match, displayId)
    if (cached) {
      return cached
    }
  } catch {
    // IndexedDBの読み込み失敗時はAPIから取得する。
  }

  const response = await fetchUserStandardSongRecord(username, displayId, {
    includeNoPlay: true,
  })
  try {
    await saveCachedStandardSongRecord(match, displayId, response.standard)
  } catch {
    // IndexedDBへの保存失敗は画面表示を止めない。
  }

  return response.standard
}

/**
 * WORLD'S END楽曲1曲分のレコードをキャッシュ判定付きで取得する。
 *
 * @param username - レコード取得対象のユーザー名。
 * @param displayId - 取得対象の楽曲表示ID。
 * @returns 対象曲のWORLD'S ENDレコード。未プレイの場合はnull。
 */
export const fetchUserWorldsendSongRecordWithCache = async (
  username: string,
  displayId: string
): Promise<WorldsendRecordDTO | null> => {
  if (!(await isAuthenticatedOwnUser(username))) {
    const response = await fetchUserWorldsendSongRecord(username, displayId, {
      includeNoPlay: true,
    })
    return response.worldsend
  }

  let timestamps: Awaited<ReturnType<typeof fetchUserApiCacheTimestamps>>
  try {
    timestamps = await fetchUserApiCacheTimestamps(username)
  } catch {
    const response = await fetchUserWorldsendSongRecord(username, displayId, {
      includeNoPlay: true,
    })
    return response.worldsend
  }

  const match = { username, ...timestamps }
  try {
    const cached = await readCachedWorldsendSongRecord(match, displayId)
    if (typeof cached !== 'undefined') {
      return cached
    }
  } catch {
    // IndexedDBの読み込み失敗時はAPIから取得する。
  }

  const response = await fetchUserWorldsendSongRecord(username, displayId, {
    includeNoPlay: true,
  })
  try {
    await saveCachedWorldsendSongRecord(match, displayId, response.worldsend)
  } catch {
    // IndexedDBへの保存失敗は画面表示を止めない。
  }

  return response.worldsend
}
