import { queryOptions } from '@tanstack/solid-query'
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
}

/**
 * ユーザー更新日時のquery optionsを生成する。
 * @param username - 対象ユーザー名。
 * @returns 同時取得だけを共有し、自動再試行しないquery options。
 */
export const userUpdatedAtQueryOptions = (username: string) =>
  queryOptions({
    queryKey: userQueryKeys.updatedAt(username),
    queryFn: () => requestUserUpdatedAt(username),
    staleTime: 0,
    retry: false,
  })

/**
 * ユーザー更新日時を共通QueryClient経由で取得する。
 * @param username - 対象ユーザー名。
 * @returns APIから取得した更新日時。
 */
export const fetchUserUpdatedAt = (username: string) =>
  appQueryClient.fetchQuery(userUpdatedAtQueryOptions(username))
