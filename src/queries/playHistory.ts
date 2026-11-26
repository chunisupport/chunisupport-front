import { queryOptions } from '@tanstack/solid-query'
import { fetchUserPlayHistory } from '../api/users'

/** 閲覧ユーザーごとに履歴を分離するqueryキー。 */
const playHistoryQueryKey = (viewer: string | null, username: string) =>
  ['play-history', viewer, username] as const

/**
 * 表示中のプレイヤーの直近のプレイ履歴を取得するquery optionsを生成する。
 *
 * @param viewer - 管理者または編集者のユーザー名。未認証の場合はnull。
 * @param username - 履歴の対象ユーザー名。
 * @returns ページを離れたら破棄する履歴のquery options。
 */
export const playHistoryQueryOptions = (viewer: string | null, username: string) =>
  queryOptions({
    queryKey: playHistoryQueryKey(viewer, username),
    queryFn: ({ signal }) => fetchUserPlayHistory(username, signal),
    enabled: viewer !== null,
    gcTime: 0,
  })
