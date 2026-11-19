import { queryOptions } from '@tanstack/solid-query'
import { fetchCourseStats } from '../api/courses'
import { fetchCoursesWithCache } from '../usecases/cache/fetchCoursesWithCache'
import { fetchUserCourseRecordsWithCache } from '../usecases/cache/fetchUserCourseRecordsWithCache'
import { mergeCourseRecords } from '../utils/courseRecordMerger'

/** 統計はバッチ集計のため、短時間の再取得を避ける時間 */
const COURSE_STATS_STALE_TIME_MS = 10 * 60 * 1000

/** コース画面queryのkey factory。 */
export const courseQueryKeys = {
  all: ['course-pages'] as const,
  /** @returns プレイ記録を含まないコースマスタ一覧のqueryキー。 */
  master: () => [...courseQueryKeys.all, 'master'] as const,
  /** @returns 閲覧ユーザーのレコードを合わせたコース一覧のqueryキー。未ログインはnull。 */
  list: (username: string | null) => [...courseQueryKeys.all, 'list', username] as const,
  /** @returns コース統計のqueryキー。 */
  stats: (displayId: string) => [...courseQueryKeys.all, 'stats', displayId] as const,
}

/**
 * 閲覧ユーザーのレコードを合わせたコース一覧のquery optionsを生成する。
 *
 * @param username - ログイン中のユーザー名。未ログインはnull。
 * @returns 未ログイン時は全コースを未プレイとして返すquery options。
 */
export const courseListQueryOptions = (username: string | null) =>
  queryOptions({
    queryKey: courseQueryKeys.list(username),
    queryFn: async () => {
      if (username) return fetchUserCourseRecordsWithCache(username)
      const master = await fetchCoursesWithCache()
      return mergeCourseRecords(master.courses, [], master.updatedAt)
    },
  })

/**
 * コースマスタのみをIndexedDB経由で取得するquery optionsを生成する。
 *
 * @returns コース一覧と更新日時を取得するquery options。
 */
export const courseMasterQueryOptions = () =>
  queryOptions({
    queryKey: courseQueryKeys.master(),
    queryFn: fetchCoursesWithCache,
  })

/**
 * コース統計のquery optionsを生成する。
 *
 * @param displayId - 対象コースの表示ID。
 * @returns コース統計用query options。
 */
export const courseStatsQueryOptions = (displayId: string) =>
  queryOptions({
    queryKey: courseQueryKeys.stats(displayId),
    queryFn: () => fetchCourseStats(displayId),
    staleTime: COURSE_STATS_STALE_TIME_MS,
  })
