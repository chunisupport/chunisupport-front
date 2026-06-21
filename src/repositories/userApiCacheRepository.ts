import { CLIENT_CACHE_SCHEMA_VERSION, db, type UserApiResponse } from '../lib/db/cacheDB'
import type { UserRatingDTO, UserRecordDTO } from '../types/api'

type UserApiCacheMatch = {
  username: string
  userUpdatedAt: string | null
  songsUpdatedAt: string | null
}

/**
 * キャッシュ済みレーティングレスポンスが現行API契約の集計値を持つか判定する。
 *
 * @param data - 判定対象のレーティングレスポンス。
 * @returns 現行API契約を満たす場合はtrue。
 */
const hasCurrentRatingSummary = (data: UserRatingDTO): boolean =>
  (typeof data.rating === 'number' || data.rating === null) &&
  (typeof data.best_average === 'number' || data.best_average === null) &&
  (typeof data.new_average === 'number' || data.new_average === null)

/**
 * ユーザー API キャッシュが現行スキーマと更新日時に一致するか判定する。
 *
 * @param cached - IndexedDB から読み込んだ保存済みレスポンス。
 * @param match - 対象ユーザー名と API 更新日時。
 * @returns キャッシュが利用可能な場合は true。
 */
const isUserApiCacheMatched = (
  cached: UserApiResponse | undefined,
  match: UserApiCacheMatch
): cached is UserApiResponse =>
  cached?.schemaVersion === CLIENT_CACHE_SCHEMA_VERSION &&
  cached.username === match.username &&
  cached.userUpdatedAt === match.userUpdatedAt &&
  cached.songsUpdatedAt === match.songsUpdatedAt

/**
 * レーティング API レスポンスキャッシュを読み込む。
 *
 * @param match - 対象ユーザー名と API 更新日時。
 * @returns 利用可能なレーティングレスポンス。存在しない場合は null。
 */
export const readCachedUserRating = async (
  match: UserApiCacheMatch
): Promise<UserRatingDTO | null> => {
  const cached = await db.userApiResponses.get('userRating')
  if (
    !isUserApiCacheMatched(cached, match) ||
    cached.key !== 'userRating' ||
    !hasCurrentRatingSummary(cached.data)
  ) {
    return null
  }

  return cached.data
}

/**
 * レコード API レスポンスキャッシュを読み込む。
 *
 * @param match - 対象ユーザー名と API 更新日時。
 * @returns 利用可能なレコードレスポンス。存在しない場合は null。
 */
export const readCachedUserRecord = async (
  match: UserApiCacheMatch
): Promise<UserRecordDTO | null> => {
  const cached = await db.userApiResponses.get('userRecord')
  if (!isUserApiCacheMatched(cached, match) || cached.key !== 'userRecord') {
    return null
  }

  return cached.data
}

/**
 * ユーザー API レスポンスキャッシュを保存する。
 *
 * @param response - 保存するキャッシュエントリ。
 * @returns 保存完了後に解決される Promise。
 */
const saveUserApiResponse = async (response: UserApiResponse): Promise<void> => {
  await db.userApiResponses.put(response)
}

/**
 * RATINGとレコードのユーザーAPIキャッシュをすべて削除する。
 *
 * @returns キャッシュ削除完了後に解決されるPromise。
 */
export const clearCachedUserApiResponses = (): Promise<void> => db.userApiResponses.clear()

/**
 * レーティング API レスポンスキャッシュを保存する。
 *
 * @param username - 対象ユーザー名。
 * @param userUpdatedAt - ユーザー更新日時。
 * @param songsUpdatedAt - 楽曲更新日時。
 * @param data - 保存するレーティングレスポンス。
 * @returns 保存完了後に解決される Promise。
 */
export const saveCachedUserRating = (
  username: string,
  userUpdatedAt: string | null,
  songsUpdatedAt: string | null,
  data: UserRatingDTO
): Promise<void> =>
  saveUserApiResponse({
    key: 'userRating',
    username,
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
    userUpdatedAt,
    songsUpdatedAt,
    fetchedAt: new Date().toISOString(),
    data,
  })

/**
 * レコード API レスポンスキャッシュを保存する。
 *
 * @param username - 対象ユーザー名。
 * @param userUpdatedAt - ユーザー更新日時。
 * @param songsUpdatedAt - 楽曲更新日時。
 * @param data - 保存するレコードレスポンス。
 * @returns 保存完了後に解決される Promise。
 */
export const saveCachedUserRecord = (
  username: string,
  userUpdatedAt: string | null,
  songsUpdatedAt: string | null,
  data: UserRecordDTO
): Promise<void> =>
  saveUserApiResponse({
    key: 'userRecord',
    username,
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
    userUpdatedAt,
    songsUpdatedAt,
    fetchedAt: new Date().toISOString(),
    data,
  })
