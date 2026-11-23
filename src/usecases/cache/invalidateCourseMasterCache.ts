import { invalidateCoursesUpdatedAtCache } from '../../queries/masterData'
import { clearCachedCourses } from '../../repositories/courseCacheRepository'

/**
 * コース編集後にメモリ上のコース更新日時とIndexedDBのコースマスタキャッシュを無効化する。
 *
 * @returns 無効化処理完了後に解決されるPromise。
 */
export const invalidateCourseMasterCache = async (): Promise<void> => {
  invalidateCoursesUpdatedAtCache()
  try {
    await clearCachedCourses()
  } catch {
    // IndexedDBの削除失敗時も、更新日時の再検証で新しい一覧を取得できる。
  }
}
