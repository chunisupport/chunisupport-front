import { type QueryClient, queryOptions } from '@tanstack/solid-query'
import { fetchRecentPlayerDataUpdates } from '../api/register-data'
import { fetchUserComment } from '../api/userComment'
import { fetchUserProfileSummary, requestUserUpdatedAt } from '../api/users'
import { appQueryClient } from '../lib/queryClient'
import type { UserRecordDTO } from '../types/api'
import { fetchLandingProfile } from '../usecases/auth/fetchLandingProfile'
import { fetchUserRatingWithCache } from '../usecases/cache/fetchUserRatingWithCache'
import { fetchUserRecordWithCache } from '../usecases/cache/fetchUserRecordWithCache'

/** 全楽曲レコードを画面間で再利用する期間。 */
const USER_RECORD_STALE_TIME_MS = 5 * 60 * 1_000

/** ユーザーqueryのkey factory。 */
export const userQueryKeys = {
  /**
   * ユーザー別の更新日時キーを生成する。
   * @param username - 対象ユーザー名。
   * @returns ユーザー別の更新日時キー。
   */
  updatedAt: (username: string) => ['users', username, 'updated-at'] as const,
  /**
   * ユーザー別のプロフィールコメントキーを生成する。
   * @param username - 対象ユーザー名。
   * @returns ユーザー別のプロフィールコメントキー。
   */
  comment: (username: string) => ['users', username, 'comment'] as const,
  /**
   * ユーザー別のホーム表示用プロフィールキーを生成する。
   * @param username - 対象ユーザー名。
   * @returns ユーザー別のホーム表示用プロフィールキー。
   */
  landingProfile: (username: string) => ['users', username, 'landing-profile'] as const,
  /**
   * ユーザー別のレーティング情報キーを生成する。
   * @param username - 対象ユーザー名。
   * @returns ユーザー別のレーティング情報キー。
   */
  rating: (username: string) => ['users', username, 'rating'] as const,
  /**
   * ユーザー別の全楽曲レコード（自己ベスト）キーを生成する。
   * @param username - 対象ユーザー名。
   * @returns ユーザー別の全楽曲レコードキー。
   */
  record: (username: string) => ['users', username, 'record'] as const,
  /** 本人のスコア更新履歴。 */
  recentUpdates: (username?: string) => ['users', username ?? '', 'recent-score-updates'] as const,
}

/** 閲覧中の本人だけが使う更新履歴を取得し、画面を離れたら保持しない。 */
export const recentScoreUpdatesQueryOptions = (username?: string) =>
  queryOptions({
    queryKey: userQueryKeys.recentUpdates(username),
    queryFn: ({ signal }) => fetchRecentPlayerDataUpdates(signal),
    enabled: Boolean(username),
    staleTime: Infinity,
    gcTime: 0,
  })

/**
 * プロフィールコメントのquery optionsを生成する。
 * `enabled` が false のときは query を無効にし、取得関数を呼ばない。
 * @param username - 対象ユーザー名。
 * @param enabled - コメント取得を行うか。feature-flag が無効な画面では false を渡す。
 * @returns コメントを取得するquery options。未設定の場合のデータは null。
 */
export const userCommentQueryOptions = (username: string, enabled: boolean) =>
  queryOptions({
    queryKey: userQueryKeys.comment(username),
    queryFn: ({ signal }) => fetchUserComment(username, signal),
    enabled,
  })

/**
 * ユーザー更新日時のquery optionsを生成する。
 * @param username - 対象ユーザー名。
 * @returns 同時取得だけを共有し、オフライン時も一時停止・自動再試行しないquery options。
 */
export const userUpdatedAtQueryOptions = (username: string) =>
  queryOptions({
    queryKey: userQueryKeys.updatedAt(username),
    queryFn: () => requestUserUpdatedAt(username),
    staleTime: 0,
    retry: false,
    networkMode: 'always',
  })

/**
 * ユーザー更新日時を共通QueryClient経由で取得する。
 * @param username - 対象ユーザー名。
 * @returns APIから取得した更新日時。
 */
export const fetchUserUpdatedAt = (username: string) =>
  appQueryClient.fetchQuery(userUpdatedAtQueryOptions(username))

/**
 * ユーザーのレーティング情報をキャッシュ付きで取得するquery optionsを生成する。
 *
 * @param username - 対象ユーザー名。未ログイン時は null。
 * @returns ユーザーレーティング取得用のquery options。
 */
export const userRatingQueryOptions = (username: string | null) =>
  queryOptions({
    queryKey: userQueryKeys.rating(username ?? ''),
    queryFn: () => fetchUserRatingWithCache(username ?? ''),
    enabled: Boolean(username),
  })

/**
 * ユーザーの全楽曲レコード（通常譜面とWORLD'S ENDの自己ベスト）をキャッシュ付きで取得するquery optionsを生成する。
 * IndexedDBから返せる場合もあるためオフラインでも取得し、失敗時は画面ごとに差が出ないよう再試行しない。
 *
 * @param username - 対象ユーザー名。取得不要ならnull。
 * @returns 全楽曲レコードを5分間再利用するquery options。
 */
export const userRecordQueryOptions = (username: string | null) =>
  queryOptions({
    queryKey: userQueryKeys.record(username ?? ''),
    queryFn: (): Promise<UserRecordDTO> => fetchUserRecordWithCache(username ?? ''),
    enabled: Boolean(username),
    staleTime: USER_RECORD_STALE_TIME_MS,
    networkMode: 'always',
    retry: false,
  })

/**
 * ユーザーのホーム表示用プロフィール（名札情報とレーティング）を取得するquery optionsを生成する。
 *
 * @param username - 対象ユーザー名。未ログイン時は null。
 * @returns ホーム表示用プロフィール取得用のquery options。
 */
export const userLandingProfileQueryOptions = (username: string | null) =>
  queryOptions({
    queryKey: userQueryKeys.landingProfile(username ?? ''),
    queryFn: () =>
      fetchLandingProfile(username ?? '', {
        fetchProfile: fetchUserProfileSummary,
        fetchRating: fetchUserRatingWithCache,
      }),
    enabled: Boolean(username),
  })

/**
 * ユーザーの全楽曲レコードqueryを進行中の取得ごと破棄する。
 * 破棄前に始まった取得の応答は以後のキャッシュに採用しない。
 *
 * @param queryClient - 対象のQueryClient。
 * @param username - レコードを破棄するユーザー名。
 * @returns なし。
 */
export const removeUserRecordQuery = (queryClient: QueryClient, username: string): void => {
  queryClient.removeQueries({ queryKey: userQueryKeys.record(username), exact: true })
}
