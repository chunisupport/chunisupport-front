import { queryOptions } from '@tanstack/solid-query'
import {
  fetchCourseDetail,
  fetchCourseStats,
  fetchManagedCourses,
  fetchOwnCourseScoreHistory,
} from '../api/courses'
import type { UserRecordDTO } from '../types/api'
import { fetchAllSongsWithCache } from '../usecases/cache/fetchAllSongsWithCache'
import { fetchCoursesWithCache } from '../usecases/cache/fetchCoursesWithCache'
import { fetchUserCourseRecordsWithCache } from '../usecases/cache/fetchUserCourseRecordsWithCache'
import { fetchUserRecordWithCache } from '../usecases/cache/fetchUserRecordWithCache'
import { fetchWorldsendSongsWithCache } from '../usecases/cache/fetchWorldsendSongsWithCache'
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
  /** @returns コース構成の楽曲選択で参照する通常楽曲のqueryキー。 */
  trackSongs: () => [...courseQueryKeys.all, 'track-songs'] as const,
  /** @returns コース編集で使うWORLD'S END楽曲一覧のqueryキー。 */
  trackWorldsendSongs: () => [...courseQueryKeys.all, 'track-worldsend-songs'] as const,
  /** @returns 構成譜面との比較に使う自己ベストのqueryキー。 */
  trackScores: (username: string | null) =>
    [...courseQueryKeys.user(username), 'track-scores'] as const,
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

/** @returns トラック編集の譜面選択用query options。 */
export const courseTrackSongsQueryOptions = () =>
  queryOptions({
    queryKey: courseQueryKeys.trackSongs(),
    queryFn: () => fetchAllSongsWithCache(),
  })

/** @returns トラック編集のWORLD'S END譜面選択用query options。 */
export const courseTrackWorldsendSongsQueryOptions = () =>
  queryOptions({
    queryKey: courseQueryKeys.trackWorldsendSongs(),
    queryFn: () => fetchWorldsendSongsWithCache(),
  })

/**
 * 通常譜面とWORLD'S ENDの自己ベストを一括取得するquery optionsを生成する。
 *
 * @param username - プレイヤーデータを表示するユーザー名。取得不要ならnull。
 * @returns 比較に使う楽曲レコードのquery options。
 */
export const courseTrackScoresQueryOptions = (username: string | null) =>
  queryOptions({
    queryKey: courseQueryKeys.trackScores(username),
    queryFn: async (): Promise<UserRecordDTO> =>
      username ? fetchUserRecordWithCache(username) : { standard: [], meta: { updated_at: null } },
    enabled: username !== null,
  })
