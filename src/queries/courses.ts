import { queryOptions } from '@tanstack/solid-query'
import {
  fetchCourseDetail,
  fetchCourseStats,
  fetchManagedCourses,
  fetchOwnCourseScoreHistory,
} from '../api/courses'
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
  /**
   * ユーザー名変更やログアウト時に破棄するコース関連queryの共通キー。
   *
   * @param username - 閲覧ユーザー名。未ログインはnull。
   * @returns 閲覧ユーザーのコース一覧・スコア履歴に共通するqueryキー。
   */
  user: (username: string | null) => [...courseQueryKeys.all, 'user', username] as const,
  /** @returns 閲覧ユーザーのレコードを合わせたコース一覧のqueryキー。未ログインはnull。 */
  list: (username: string | null) => [...courseQueryKeys.user(username), 'list'] as const,
  /** @returns 編集可能なコース一覧のqueryキー。 */
  managed: (username: string | null) => [...courseQueryKeys.user(username), 'managed'] as const,
  /** @returns コース詳細と現行の候補譜面のqueryキー。 */
  detail: (displayId: string) => [...courseQueryKeys.all, 'detail', displayId] as const,
  /** @returns コース統計のqueryキー。 */
  stats: (displayId: string) => [...courseQueryKeys.all, 'stats', displayId] as const,
  /** @returns ユーザー別・コース別のスコア履歴のqueryキー。 */
  history: (username: string, displayId: string) =>
    [...courseQueryKeys.user(username), 'history', displayId] as const,
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
 * コーススコア履歴のquery optionsを生成する。
 *
 * @param username - 現在のログインユーザー名。
 * @param displayId - 対象コースの表示ID。
 * @returns コーススコア履歴用query options。
 */
export const courseScoreHistoryQueryOptions = (username: string, displayId: string) =>
  queryOptions({
    queryKey: courseQueryKeys.history(username, displayId),
    queryFn: ({ signal }) => fetchOwnCourseScoreHistory(username, displayId, signal),
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

/**
 * 編集者向けコース一覧のquery optionsを生成する。
 *
 * @param username - 現在の編集者のユーザー名。
 * @returns 削除済みを含む一覧用query options。
 */
export const managedCoursesQueryOptions = (username: string | null) =>
  queryOptions({
    queryKey: courseQueryKeys.managed(username),
    queryFn: ({ signal }) => fetchManagedCourses(signal),
    enabled: username !== null,
  })

/**
 * 候補譜面つきコース詳細のquery optionsを生成する。
 *
 * @param displayId - コースの公開ID。
 * @returns コース詳細用query options。
 */
export const courseDetailQueryOptions = (displayId: string) =>
  queryOptions({
    queryKey: courseQueryKeys.detail(displayId),
    queryFn: ({ signal }) => fetchCourseDetail(displayId, signal),
  })
