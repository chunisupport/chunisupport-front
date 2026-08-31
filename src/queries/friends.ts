import { type QueryClient, type QueryKey, queryOptions } from '@tanstack/solid-query'
import { fetchFriends, fetchReceivedFriendRequests, fetchSentFriendRequests } from '../api/friends'
import { FRIEND_QUERY_STALE_TIME_MS } from './friendQueryConstants'
import { friendRankingQueryKeys } from './friendRankings'

/** フレンド操作の種類。 */
export type FriendshipMutationType = 'request' | 'accept' | 'reject' | 'cancel' | 'remove'

/** mutation成功後に無効化するqueryの条件。 */
export type FriendQueryInvalidationFilter = {
  queryKey: QueryKey
  exact?: boolean
}

/** フレンド一覧queryのkey factory。 */
export const friendshipQueryKeys = {
  all: ['friendships'] as const,
  user: (username: string | null) => ['friendships', username] as const,
  friends: (username: string | null) => ['friendships', username, 'friends'] as const,
  requests: (username: string | null) => ['friendships', username, 'requests'] as const,
  received: (username: string | null) => ['friendships', username, 'requests', 'received'] as const,
  sent: (username: string | null) => ['friendships', username, 'requests', 'sent'] as const,
}

/** フレンドmutationのkey factory。 */
export const friendMutationKeys = {
  all: ['friendship-mutations'] as const,
  operation: (username: string, operation: FriendshipMutationType) =>
    ['friendship-mutations', username, operation] as const,
}

/**
 * 承認済みフレンド一覧query optionsを生成する。
 *
 * @param username - 現在の認証ユーザー名。
 * @returns 承認済みフレンド一覧用query options。
 */
export const friendsQueryOptions = (username: string | null) =>
  queryOptions({
    queryKey: friendshipQueryKeys.friends(username),
    queryFn: async ({ signal }) => (await fetchFriends(signal)).items,
    enabled: Boolean(username),
    staleTime: FRIEND_QUERY_STALE_TIME_MS,
  })

/**
 * 受信済みフレンド申請一覧query optionsを生成する。
 *
 * @param username - 現在の認証ユーザー名。
 * @returns 受信済み申請一覧用query options。
 */
export const receivedFriendRequestsQueryOptions = (username: string | null) =>
  queryOptions({
    queryKey: friendshipQueryKeys.received(username),
    queryFn: async ({ signal }) => (await fetchReceivedFriendRequests(signal)).items,
    enabled: Boolean(username),
    staleTime: FRIEND_QUERY_STALE_TIME_MS,
  })

/**
 * 送信済みフレンド申請一覧query optionsを生成する。
 *
 * @param username - 現在の認証ユーザー名。
 * @returns 送信済み申請一覧用query options。
 */
export const sentFriendRequestsQueryOptions = (username: string | null) =>
  queryOptions({
    queryKey: friendshipQueryKeys.sent(username),
    queryFn: async ({ signal }) => (await fetchSentFriendRequests(signal)).items,
    enabled: Boolean(username),
    staleTime: FRIEND_QUERY_STALE_TIME_MS,
  })

/**
 * フレンド操作ごとのquery無効化条件を返す。
 *
 * @param username - 操作した認証ユーザー名。
 * @param operation - 完了したフレンド操作。
 * @returns 無効化対象のquery filter一覧。
 */
export const getFriendMutationInvalidationFilters = (
  username: string,
  operation: FriendshipMutationType
): readonly FriendQueryInvalidationFilter[] => {
  const friends = { queryKey: friendshipQueryKeys.friends(username), exact: true }
  const received = { queryKey: friendshipQueryKeys.received(username), exact: true }
  const sent = { queryKey: friendshipQueryKeys.sent(username), exact: true }
  const rankings = { queryKey: friendRankingQueryKeys.user(username) }

  switch (operation) {
    case 'request':
      return [friends, received, sent, rankings]
    case 'accept':
      return [received, friends, rankings]
    case 'reject':
      return [received]
    case 'cancel':
      return [sent]
    case 'remove':
      return [friends, rankings]
  }
}

/**
 * mutation成功後に影響を受けるフレンド関連queryを無効化する。
 *
 * @param queryClient - 更新対象のQueryClient。
 * @param username - 操作した認証ユーザー名。
 * @param operation - 完了したフレンド操作。
 * @returns 表示中queryの再取得完了時に解決されるPromise。
 */
export const invalidateFriendQueriesAfterMutation = async (
  queryClient: QueryClient,
  username: string,
  operation: FriendshipMutationType
): Promise<void> => {
  await Promise.all(
    getFriendMutationInvalidationFilters(username, operation).map((filter) =>
      queryClient.invalidateQueries(filter)
    )
  )
}

/**
 * 旧認証ユーザーのフレンド関連queryをキャンセルして削除する。
 *
 * @param queryClient - 破棄対象のQueryClient。
 * @param username - 以前の認証ユーザー名。
 * @returns 実行中queryのキャンセル完了時に解決されるPromise。
 */
export const clearFriendQueriesForUser = async (
  queryClient: QueryClient,
  username: string
): Promise<void> => {
  const queryKeys = [
    friendshipQueryKeys.user(username),
    friendRankingQueryKeys.user(username),
  ] as const

  await Promise.all(
    queryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey }, { silent: true }))
  )
  for (const queryKey of queryKeys) {
    queryClient.removeQueries({ queryKey })
  }
}
