import {
  type CachedUserSongRecord,
  CLIENT_CACHE_SCHEMA_VERSION,
  db,
  type UserApiResponse,
} from '../lib/db/cacheDB'
import type {
  PlayerRecordDTO,
  UserRatingDTO,
  UserRecordDTO,
  WorldsendRecordDTO,
} from '../types/api'

export type UserApiCacheMatch = {
  username: string
  userUpdatedAt: string | null
  songsUpdatedAt: string | null
}

/**
 * 曲単位レコードキャッシュのキーを生成する。
 *
 * @param username - 対象ユーザー名。
 * @param kind - 通常楽曲またはWORLD'S ENDの種別。
 * @param songId - 楽曲表示ID。
 * @returns IndexedDBで使用する一意なキー。
 */
const createUserSongRecordKey = (
  username: string,
  kind: CachedUserSongRecord['kind'],
  songId: string
): string => JSON.stringify([username, kind, songId])

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
 * 曲単位レコードキャッシュが現在のユーザーと更新日時に一致するか判定する。
 *
 * @param cached - 判定対象の曲単位キャッシュ。
 * @param match - 対象ユーザー名とAPI更新日時。
 * @returns キャッシュが利用可能な場合はtrue。
 */
const isUserSongRecordCacheMatched = (
  cached: CachedUserSongRecord | undefined,
  match: UserApiCacheMatch
): cached is CachedUserSongRecord =>
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
 * 全件取得済みの曲単位レコードキャッシュを復元する。
 *
 * @param match - 対象ユーザー名とAPI更新日時。
 * @returns 完全なレコードレスポンスを復元できる場合はその値、それ以外はnull。
 */
export const readCachedUserRecord = async (
  match: UserApiCacheMatch
): Promise<UserRecordDTO | null> => {
  const metadata = await db.cacheMetadata.get('userRecord')
  if (
    metadata?.schemaVersion !== CLIENT_CACHE_SCHEMA_VERSION ||
    metadata.username !== match.username ||
    metadata.userUpdatedAt !== match.userUpdatedAt ||
    metadata.songsUpdatedAt !== match.songsUpdatedAt
  ) {
    return null
  }

  const [standardEntries, worldsendEntries] = await Promise.all([
    db.userSongRecords.where('[username+kind]').equals([match.username, 'standard']).toArray(),
    db.userSongRecords.where('[username+kind]').equals([match.username, 'worldsend']).toArray(),
  ])
  if (
    !standardEntries.every((entry) => isUserSongRecordCacheMatched(entry, match)) ||
    !worldsendEntries.every((entry) => isUserSongRecordCacheMatched(entry, match))
  ) {
    return null
  }

  return {
    standard: [...standardEntries]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .flatMap((entry) => (entry.kind === 'standard' ? entry.data : [])),
    worldsend: [...worldsendEntries]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .flatMap((entry) => (entry.kind === 'worldsend' && entry.data ? [entry.data] : [])),
    meta: { updated_at: metadata.recordUpdatedAt ?? null },
  }
}

/**
 * 通常楽曲1曲分のレコードキャッシュを読み込む。
 *
 * @param match - 対象ユーザー名とAPI更新日時。
 * @param songId - 楽曲表示ID。
 * @returns 利用可能なレコード配列。存在しない場合はnull。
 */
export const readCachedStandardSongRecord = async (
  match: UserApiCacheMatch,
  songId: string
): Promise<PlayerRecordDTO[] | null> => {
  const cached = await db.userSongRecords.get(
    createUserSongRecordKey(match.username, 'standard', songId)
  )
  if (!isUserSongRecordCacheMatched(cached, match) || cached.kind !== 'standard') {
    return null
  }

  return cached.data
}

/**
 * WORLD'S END楽曲1曲分のレコードキャッシュを読み込む。
 *
 * @param match - 対象ユーザー名とAPI更新日時。
 * @param songId - 楽曲表示ID。
 * @returns 利用可能なレコード。未プレイの場合はnull、キャッシュがなければundefined。
 */
export const readCachedWorldsendSongRecord = async (
  match: UserApiCacheMatch,
  songId: string
): Promise<WorldsendRecordDTO | null | undefined> => {
  const cached = await db.userSongRecords.get(
    createUserSongRecordKey(match.username, 'worldsend', songId)
  )
  if (!isUserSongRecordCacheMatched(cached, match) || cached.kind !== 'worldsend') {
    return undefined
  }

  return cached.data
}

/**
 * RATING、曲単位レコード、コースレコードのユーザーAPIキャッシュをすべて削除する。
 *
 * @returns キャッシュ削除完了後に解決されるPromise。
 */
export const clearCachedUserApiResponses = async (): Promise<void> => {
  await db.transaction(
    'rw',
    db.userApiResponses,
    db.userSongRecords,
    db.userCourseRecords,
    db.cacheMetadata,
    async () => {
      await Promise.all([
        db.userApiResponses.clear(),
        db.userSongRecords.clear(),
        db.userCourseRecords.clear(),
        db.cacheMetadata.delete('userRecord'),
        db.cacheMetadata.delete('userCourseRecords'),
      ])
    }
  )
}

/**
 * レーティング API レスポンスキャッシュを保存する。
 *
 * @param username - 対象ユーザー名。
 * @param userUpdatedAt - ユーザー更新日時。
 * @param songsUpdatedAt - 楽曲更新日時。
 * @param data - 保存するレーティングレスポンス。
 * @returns 保存完了後に解決される Promise。
 */
export const saveCachedUserRating = async (
  username: string,
  userUpdatedAt: string | null,
  songsUpdatedAt: string | null,
  data: UserRatingDTO
): Promise<void> => {
  await db.userApiResponses.put({
    key: 'userRating',
    username,
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
    userUpdatedAt,
    songsUpdatedAt,
    fetchedAt: new Date().toISOString(),
    data,
  })
}

/**
 * 全件レコードレスポンスを曲単位に分割して保存する。
 *
 * @param username - 対象ユーザー名。
 * @param userUpdatedAt - ユーザー更新日時。
 * @param songsUpdatedAt - 楽曲更新日時。
 * @param data - 保存する全件レコードレスポンス。
 * @returns 保存完了後に解決されるPromise。
 */
export const saveCachedUserRecord = async (
  username: string,
  userUpdatedAt: string | null,
  songsUpdatedAt: string | null,
  data: UserRecordDTO
): Promise<void> => {
  const fetchedAt = new Date().toISOString()
  const standardBySong = new Map<string, PlayerRecordDTO[]>()
  for (const record of data.standard) {
    const records = standardBySong.get(record.id)
    if (records) {
      records.push(record)
    } else {
      standardBySong.set(record.id, [record])
    }
  }
  const entries: CachedUserSongRecord[] = [
    ...Array.from(standardBySong, ([songId, records], sortOrder) => ({
      key: createUserSongRecordKey(username, 'standard', songId),
      kind: 'standard' as const,
      username,
      songId,
      sortOrder,
      schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
      userUpdatedAt,
      songsUpdatedAt,
      fetchedAt,
      data: records,
    })),
    ...(data.worldsend ?? []).map((record, sortOrder) => ({
      key: createUserSongRecordKey(username, 'worldsend', record.id),
      kind: 'worldsend' as const,
      username,
      songId: record.id,
      sortOrder,
      schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
      userUpdatedAt,
      songsUpdatedAt,
      fetchedAt,
      data: record,
    })),
  ]

  await db.transaction('rw', db.userSongRecords, db.cacheMetadata, async () => {
    await db.userSongRecords.clear()
    await db.userSongRecords.bulkPut(entries)
    await db.cacheMetadata.put({
      key: 'userRecord',
      schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
      username,
      userUpdatedAt,
      songsUpdatedAt,
      fetchedAt,
      recordUpdatedAt: data.meta.updated_at,
    })
  })
}

/**
 * 通常楽曲1曲分のレコードを保存する。
 *
 * @param match - 対象ユーザー名とAPI更新日時。
 * @param songId - 楽曲表示ID。
 * @param data - 保存する通常譜面レコード。
 * @returns 保存完了後に解決されるPromise。
 */
export const saveCachedStandardSongRecord = (
  match: UserApiCacheMatch,
  songId: string,
  data: PlayerRecordDTO[]
): Promise<string> =>
  db.userSongRecords.put({
    key: createUserSongRecordKey(match.username, 'standard', songId),
    kind: 'standard',
    username: match.username,
    songId,
    sortOrder: 0,
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
    userUpdatedAt: match.userUpdatedAt,
    songsUpdatedAt: match.songsUpdatedAt,
    fetchedAt: new Date().toISOString(),
    data,
  })

/**
 * WORLD'S END楽曲1曲分のレコードを保存する。
 *
 * @param match - 対象ユーザー名とAPI更新日時。
 * @param songId - 楽曲表示ID。
 * @param data - 保存するWORLD'S ENDレコード。
 * @returns 保存完了後に解決されるPromise。
 */
export const saveCachedWorldsendSongRecord = (
  match: UserApiCacheMatch,
  songId: string,
  data: WorldsendRecordDTO | null
): Promise<string> =>
  db.userSongRecords.put({
    key: createUserSongRecordKey(match.username, 'worldsend', songId),
    kind: 'worldsend',
    username: match.username,
    songId,
    sortOrder: 0,
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
    userUpdatedAt: match.userUpdatedAt,
    songsUpdatedAt: match.songsUpdatedAt,
    fetchedAt: new Date().toISOString(),
    data,
  })
