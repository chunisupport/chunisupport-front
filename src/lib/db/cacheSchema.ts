import type { Dexie, EntityTable } from 'dexie'
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
import type { WorldsendFilterState, WorldsendRecordColumnId } from '../../types/worldsendRecord'

/** IndexedDB に保存するキャッシュデータの現行スキーマバージョン */
export const CLIENT_CACHE_SCHEMA_VERSION = 6

/** コース関連キャッシュの現行スキーマバージョン */
export const COURSE_CACHE_SCHEMA_VERSION = 2

/** フロントエンドキャッシュ用 IndexedDB の DB 名 */
export const CLIENT_CACHE_DB_NAME = 'ChuniSupportCache'

/** `cacheMetadata` ストアのキー。キャッシュ種別ごとに1件のメタデータを持つ */
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

/** キャッシュの有効性判定に使うメタデータ */
export type CacheMetadata = {
  key: CacheMetadataKey
  schemaVersion: number
  courseSchemaVersion?: number
  songsUpdatedAt?: string | null
  coursesUpdatedAt?: string | null
  userUpdatedAt?: string | null
  username?: string
  fetchedAt?: string
  savedAt?: string
  recordUpdatedAt?: string | null
}

/** IndexedDB に保存する通常楽曲マスタ1件 */
export type CachedSong = {
  id: string
  sortOrder: number
  data: SongDTO
}

/** IndexedDB に保存する WORLD'S END 楽曲マスタ1件 */
export type CachedWorldsendSong = {
  id: string
  sortOrder: number
  data: WorldsendSongDTO
}

/** IndexedDB に保存するコースマスタ1件 */
export type CachedCourse = {
  id: string
  sortOrder: number
  schemaVersion: number
  data: CourseDTO
}

/** マスタ情報を除いて IndexedDB に保存するプレイ済みコースレコード */
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

/** IndexedDB に保存するユーザーの曲単位レコード。通常楽曲と WORLD'S END を `kind` で区別する */
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

/** IndexedDB に保存するユーザーレーティング API のレスポンス */
export type UserApiResponse = {
  key: 'userRating'
  username: string
  schemaVersion: number
  userUpdatedAt: string | null
  songsUpdatedAt: string | null
  fetchedAt: string
  data: UserRatingDTO
}

/** IndexedDB に保存するレコード画面の表示設定 */
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

/** IndexedDB に保存するフレンド申請通知の取得状態 */
export type FriendRequestNotificationState = {
  key: string
  username: string
  schemaVersion: number
  hasPendingReceivedRequest: boolean
  fetchedAt: string
}

/** フロントエンドキャッシュ用 IndexedDB のテーブル定義を含む Dexie 型 */
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
