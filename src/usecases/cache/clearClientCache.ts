import { db } from '../../lib/db/cacheDB.ts'

/**
 * IndexedDB に保存したフロントエンドキャッシュを全削除する。
 *
 * @returns 削除処理完了後に解決される Promise。
 */
export const clearClientCache = async (): Promise<void> => {
  await db.transaction(
    'rw',
    db.cacheMetadata,
    db.songs,
    db.worldsendSongs,
    db.userApiResponses,
    db.viewSettings,
    async () => {
      await Promise.all([
        db.cacheMetadata.clear(),
        db.songs.clear(),
        db.worldsendSongs.clear(),
        db.userApiResponses.clear(),
        db.viewSettings.clear(),
      ])
    }
  )
}
