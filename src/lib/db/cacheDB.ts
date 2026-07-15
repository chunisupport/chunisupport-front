import Dexie, { type EntityTable } from 'dexie'
import type { WorldsendFilterState } from '../../pages/users/WorldsendRecord/types/filterTypes'
import type { WorldsendRecordColumnId } from '../../pages/users/WorldsendRecord/utils/columns'
import type {
  CourseDTO,
  PlayerRecordDTO,
  SongDTO,
  UserRatingDTO,
  WorldsendRecordDTO,
  WorldsendSongDTO,
} from '../../types/api'
import type { PlayedCourseRecord } from '../../types/courseRecord'
import type { FilterState, RecordColumnId } from '../../types/recordFilter'

/** IndexedDB に保存するキャッシュデータの現行スキーマバージョン。 */
export const CLIENT_CACHE_SCHEMA_VERSION = 6

/** フロントエンドキャッシュ用 IndexedDB の DB 名。 */
export const CLIENT_CACHE_DB_NAME = 'ChuniSupportCache'

export type CacheMetadataKey =
  | 'songs'
  | 'worldsendSongs'
  | 'courses'
  | 'userRating'
  | 'userRecord'
  | 'userCourseRecords'
  | 'standardRecordFilter'
  | 'standardRecordColumns'
  | 'worldsendRecordFilter'
  | 'worldsendRecordColumns'

export type CacheMetadata = {
  key: CacheMetadataKey
  schemaVersion: number
  songsUpdatedAt?: string | null
  coursesUpdatedAt?: string | null
  userUpdatedAt?: string | null
  username?: string
  fetchedAt?: string
  savedAt?: string
  recordUpdatedAt?: string | null
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

/** IndexedDB に保存するコースマスタ1件。 */
export type CachedCourse = {
  id: string
  sortOrder: number
  data: CourseDTO
}

/** マスタ情報を除いて IndexedDB に保存するプレイ済みコースレコード。 */
export type CachedUserCourseRecord = {
  key: string
  username: string
  courseId: string
  sortOrder: number
  schemaVersion: number
  userUpdatedAt: string | null
  fetchedAt: string
  data: PlayedCourseRecord
}

export type CachedUserSongRecord =
  | {
      key: string
      kind: 'standard'
      username: string
      songId: string
      sortOrder: number
      schemaVersion: number
      userUpdatedAt: string | null
      songsUpdatedAt: string | null
      fetchedAt: string
      data: PlayerRecordDTO[]
    }
  | {
      key: string
      kind: 'worldsend'
      username: string
      songId: string
      sortOrder: number
      schemaVersion: number
      userUpdatedAt: string | null
      songsUpdatedAt: string | null
      fetchedAt: string
      data: WorldsendRecordDTO | null
    }

export type UserApiResponse = {
  key: 'userRating'
  username: string
  schemaVersion: number
  userUpdatedAt: string | null
  songsUpdatedAt: string | null
  fetchedAt: string
  data: UserRatingDTO
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

export type FriendRequestNotificationState = {
  key: string
  username: string
  schemaVersion: number
  hasPendingReceivedRequest: boolean
  fetchedAt: string
}

export type CacheDB = Dexie & {
  cacheMetadata: EntityTable<CacheMetadata, 'key'>
  songs: EntityTable<CachedSong, 'id'>
  worldsendSongs: EntityTable<CachedWorldsendSong, 'id'>
  courses: EntityTable<CachedCourse, 'id'>
  userSongRecords: EntityTable<CachedUserSongRecord, 'key'>
  userCourseRecords: EntityTable<CachedUserCourseRecord, 'key'>
  userApiResponses: EntityTable<UserApiResponse, 'key'>
  viewSettings: EntityTable<ViewSetting, 'key'>
  friendRequestNotificationStates: EntityTable<FriendRequestNotificationState, 'key'>
}

export const db = new Dexie(CLIENT_CACHE_DB_NAME) as CacheDB

db.version(1).stores({
  cacheMetadata: 'key, schemaVersion, songsUpdatedAt, userUpdatedAt, fetchedAt, savedAt',
  songs: 'id',
  worldsendSongs: 'id',
  userApiResponses: 'key, username, schemaVersion, userUpdatedAt, songsUpdatedAt, fetchedAt',
  viewSettings: 'key, schemaVersion, savedAt',
})

db.version(2)
  .stores({
    cacheMetadata:
      'key, schemaVersion, songsUpdatedAt, userUpdatedAt, username, fetchedAt, savedAt, recordUpdatedAt',
    userSongRecords:
      'key, [username+kind], username, kind, songId, sortOrder, schemaVersion, userUpdatedAt, songsUpdatedAt, fetchedAt',
  })
  .upgrade(async (transaction) => {
    await transaction.table('userApiResponses').delete('userRecord')
  })

db.version(3).stores({
  friendRequestNotificationStates: 'key, username, schemaVersion, fetchedAt',
})

db.version(4).stores({
  cacheMetadata:
    'key, schemaVersion, songsUpdatedAt, coursesUpdatedAt, userUpdatedAt, username, fetchedAt, savedAt, recordUpdatedAt',
  courses: 'id',
  userCourseRecords: 'key, username, courseId, sortOrder, schemaVersion, userUpdatedAt, fetchedAt',
})
