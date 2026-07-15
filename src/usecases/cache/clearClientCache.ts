import { db } from '../../lib/db/cacheDB'

/**
 * IndexedDB に保存したフロントエンドキャッシュを全削除する。
 *
 * @returns 削除処理完了後に解決される Promise。
 */
export const clearClientCache = async (): Promise<void> => {
  await db.transaction(
    'rw',
    [
      db.cacheMetadata,
      db.songs,
      db.worldsendSongs,
      db.courses,
      db.userSongRecords,
      db.userCourseRecords,
      db.userApiResponses,
      db.viewSettings,
      db.friendRequestNotificationStates,
    ],
    async () => {
      await Promise.all([
        db.cacheMetadata.clear(),
        db.songs.clear(),
        db.worldsendSongs.clear(),
        db.courses.clear(),
        db.userSongRecords.clear(),
        db.userCourseRecords.clear(),
        db.userApiResponses.clear(),
        db.viewSettings.clear(),
        db.friendRequestNotificationStates.clear(),
      ])
    }
  )
}
