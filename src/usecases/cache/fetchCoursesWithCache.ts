import { fetchCourses, fetchCoursesUpdatedAt } from '../../api/songs'
import { readCachedCourses, replaceCachedCourses } from '../../repositories/courseCacheRepository'
import type { CourseDTO } from '../../types/api'

/** キャッシュ判定に使用した更新日時付きコースマスタ取得結果 */
export type CoursesWithCacheResponse = {
  courses: CourseDTO[]
  updatedAt: string | null
}

/**
 * コースマスタ一覧をIndexedDBキャッシュ判定付きで取得する。
 *
 * @returns コースマスタ一覧とキャッシュ判定に使用した更新日時。
 */
export const fetchCoursesWithCache = async (): Promise<CoursesWithCacheResponse> => {
  let coursesUpdatedAt: string | null

  try {
    coursesUpdatedAt = (await fetchCoursesUpdatedAt()).updated_at
  } catch {
    const response = await fetchCourses()
    return { ...response, updatedAt: null }
  }

  try {
    const cachedCourses = await readCachedCourses(coursesUpdatedAt)
    if (cachedCourses) {
      return { courses: cachedCourses, updatedAt: coursesUpdatedAt }
    }
  } catch {
    const response = await fetchCourses()
    return { ...response, updatedAt: coursesUpdatedAt }
  }

  const response = await fetchCourses()

  try {
    await replaceCachedCourses(response.courses, coursesUpdatedAt)
  } catch {
    // IndexedDBへの保存失敗は画面表示を止めない。
  }

  return { ...response, updatedAt: coursesUpdatedAt }
}
