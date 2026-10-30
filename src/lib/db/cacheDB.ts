import Dexie from 'dexie'
import { type CacheDB, CLIENT_CACHE_DB_NAME } from './cacheSchema'

/**
 * フロントエンドキャッシュ用 IndexedDB の Dexie インスタンス。
 * 初期バンドルに Dexie を含めないよう、アプリケーションコードからは `getCacheDB()` 経由で読み込む。
 */
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
