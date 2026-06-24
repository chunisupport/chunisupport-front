import Dexie, { type EntityTable } from 'dexie'
import type { FilterState, RecordColumnId } from '../../pages/users/UserRecord/types/types'
import type { WorldsendFilterState } from '../../pages/users/WorldsendRecord/types/filterTypes'
import type { WorldsendRecordColumnId } from '../../pages/users/WorldsendRecord/utils/columns'
import type { SongDTO, UserRatingDTO, UserRecordDTO, WorldsendSongDTO } from '../../types/api'

/** IndexedDB に保存するキャッシュデータの現行スキーマバージョン。 */
export const CLIENT_CACHE_SCHEMA_VERSION = 2

/** フロントエンドキャッシュ用 IndexedDB の DB 名。 */
export const CLIENT_CACHE_DB_NAME = 'ChuniSupportCache'

export type CacheMetadataKey =
  | 'songs'
  | 'worldsendSongs'
  | 'userRating'
  | 'userRecord'
  | 'standardRecordFilter'
  | 'standardRecordColumns'
  | 'worldsendRecordFilter'
  | 'worldsendRecordColumns'

export type CacheMetadata = {
  key: CacheMetadataKey
  schemaVersion: number
  songsUpdatedAt?: string | null
  userUpdatedAt?: string | null
  fetchedAt?: string
  savedAt?: string
}

export type CachedSong = {
  id: string
  sortOrder: number
  data: SongDTO
}

export type CachedWorldsendSong = {
  id: string
  sortOrder: number
  data: WorldsendSongDTO
}

export type UserApiResponse =
  | {
      key: 'userRating'
      username: string
      schemaVersion: number
      userUpdatedAt: string | null
      songsUpdatedAt: string | null
      fetchedAt: string
      data: UserRatingDTO
    }
  | {
      key: 'userRecord'
      username: string
      schemaVersion: number
      userUpdatedAt: string | null
      songsUpdatedAt: string | null
      fetchedAt: string
      data: UserRecordDTO
    }

export type ViewSetting =
  | {
      key: 'standardRecordFilter'
      schemaVersion: number
      savedAt: string
      data: FilterState
    }
  | {
      key: 'standardRecordColumns'
      schemaVersion: number
      savedAt: string
      data: RecordColumnId[]
    }
  | {
      key: 'worldsendRecordFilter'
      schemaVersion: number
      savedAt: string
      data: WorldsendFilterState
    }
  | {
      key: 'worldsendRecordColumns'
      schemaVersion: number
      savedAt: string
      data: WorldsendRecordColumnId[]
    }

export type CacheDB = Dexie & {
  cacheMetadata: EntityTable<CacheMetadata, 'key'>
  songs: EntityTable<CachedSong, 'id'>
  worldsendSongs: EntityTable<CachedWorldsendSong, 'id'>
  userApiResponses: EntityTable<UserApiResponse, 'key'>
  viewSettings: EntityTable<ViewSetting, 'key'>
}

export const db = new Dexie(CLIENT_CACHE_DB_NAME) as CacheDB

db.version(1).stores({
  cacheMetadata: 'key, schemaVersion, songsUpdatedAt, userUpdatedAt, fetchedAt, savedAt',
  songs: 'id',
  worldsendSongs: 'id',
  userApiResponses: 'key, username, schemaVersion, userUpdatedAt, songsUpdatedAt, fetchedAt',
  viewSettings: 'key, schemaVersion, savedAt',
})
