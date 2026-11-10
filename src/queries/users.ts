import { queryOptions } from '@tanstack/solid-query'
import { fetchUserComment } from '../api/userComment'
import { requestUserUpdatedAt } from '../api/users'
import { appQueryClient } from '../lib/queryClient'

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
}

/**
 * プロフィールコメントのquery optionsを生成する。
 * @param username - 対象ユーザー名。
 * @returns コメントを取得するquery options。未設定の場合のデータは null。
 */
export const userCommentQueryOptions = (username: string) =>
  queryOptions({
    queryKey: userQueryKeys.comment(username),
    queryFn: ({ signal }) => fetchUserComment(username, signal),
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
