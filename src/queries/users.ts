import { queryOptions } from '@tanstack/solid-query'
import { fetchUserComment } from '../api/userComment'
import { requestUserUpdatedAt } from '../api/users'
import { appQueryClient } from '../lib/queryClient'
import { fetchUserRatingWithCache } from '../usecases/cache/fetchUserRatingWithCache'

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
   * ユーザー別のレーティング情報キーを生成する。
   * @param username - 対象ユーザー名。
   * @returns ユーザー別のレーティング情報キー。
   */
  rating: (username: string) => ['users', username, 'rating'] as const,
}

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
