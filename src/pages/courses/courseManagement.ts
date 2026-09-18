import type { ManagedCourseDTO } from '../../types/api'
import { normalizeForSearch } from '../../utils/searchUtils'

/**
 * 編集者向けコースが論理削除済みか判定する。
 *
 * @param course - 判定対象のコース。
 * @returns 削除済みの場合は true。
 */
export const isManagedCourseDeleted = (course: Pick<ManagedCourseDTO, 'is_deleted'>): boolean =>
  course.is_deleted === true

/**
 * 編集者向けコース一覧を idx、display_id の順で並べる。
 *
 * @param courses - 並び替え対象のコース一覧。
 * @returns 並び替え後の新しい配列。
 */
export const sortManagedCourses = (courses: readonly ManagedCourseDTO[]): ManagedCourseDTO[] =>
  [...courses].sort(
    (left, right) =>
      left.idx.localeCompare(right.idx, 'ja', { numeric: true }) ||
      left.display_id.localeCompare(right.display_id, 'ja')
  )

/**
 * コース名・idx・display_id で編集者向けコース一覧を絞り込む。
 *
 * @param courses - 絞り込み対象のコース一覧。
 * @param query - 検索語。
 * @returns 検索語に一致するコース一覧。
 */
export const filterManagedCourses = (
  courses: readonly ManagedCourseDTO[],
  query: string
): ManagedCourseDTO[] => {
  const normalizedQuery = normalizeForSearch(query)
  if (!normalizedQuery) {
    return [...courses]
  }

  return courses.filter((course) =>
    normalizeForSearch(`${course.display_id} ${course.idx} ${course.name}`).includes(
      normalizedQuery
    )
  )
}
