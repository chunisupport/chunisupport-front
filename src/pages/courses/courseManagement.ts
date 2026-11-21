import type { ManagedCourseDTO } from '../../types/api'
import { normalizeForSearch } from '../../utils/searchUtils'

/** コース管理一覧の構成状態フィルター値。 */
export type CourseTrackFilterStatus = 'all' | 'unconfigured' | 'configured' | 'deleted'

/** コース管理一覧の絞り込み条件。 */
export interface ManagedCourseFilterOptions {
  /** クラス値の完全一致フィルター。空文字または未指定で全クラス。 */
  courseClass?: string
  /** 構成状態・削除状態のフィルター。省略時はすべて表示。 */
  status?: CourseTrackFilterStatus
}

/**
 * 編集者向けコースが論理削除済みか判定する。
 *
 * @param course - 判定対象のコース。
 * @returns 削除済みの場合は true。
 */
export const isManagedCourseDeleted = (course: Pick<ManagedCourseDTO, 'is_deleted'>): boolean =>
  course.is_deleted === true

/**
 * コースにトラック構成が1件以上登録されているか判定する。
 *
 * @param course - 判定対象のコース。
 * @returns トラック構成が登録済みの場合は true。
 */
export const hasCourseTracks = (course: Pick<ManagedCourseDTO, 'tracks'>): boolean =>
  (course.tracks?.length ?? 0) > 0

/**
 * 編集者向けコース一覧を idx、id の順で並べる。
 *
 * @param courses - 並び替え対象のコース一覧。
 * @returns 並び替え後の新しい配列。
 */
export const sortManagedCourses = (courses: readonly ManagedCourseDTO[]): ManagedCourseDTO[] =>
  [...courses].sort(
    (left, right) =>
      left.idx.localeCompare(right.idx, 'ja', { numeric: true }) ||
      left.id.localeCompare(right.id, 'ja')
  )

/**
 * コース名・idx・id、クラス、構成状態で編集者向けコース一覧を絞り込む。
 *
 * @param courses - 絞り込み対象のコース一覧。
 * @param query - 検索語。
 * @param options - クラス・構成状態の追加フィルター条件。
 * @returns 条件に一致するコース一覧。
 */
export const filterManagedCourses = (
  courses: readonly ManagedCourseDTO[],
  query: string,
  options: ManagedCourseFilterOptions = {}
): ManagedCourseDTO[] => {
  const normalizedQuery = normalizeForSearch(query)
  const courseClass = options.courseClass?.trim() ?? ''
  const status = options.status ?? 'all'

  return courses.filter((course) => {
    if (courseClass && course.class !== courseClass) {
      return false
    }

    const deleted = isManagedCourseDeleted(course)
    if (status === 'deleted' && !deleted) return false
    if (status === 'unconfigured' && (deleted || hasCourseTracks(course))) return false
    if (status === 'configured' && (deleted || !hasCourseTracks(course))) return false

    if (!normalizedQuery) {
      return true
    }

    return normalizeForSearch(`${course.id} ${course.idx} ${course.name}`).includes(normalizedQuery)
  })
}
