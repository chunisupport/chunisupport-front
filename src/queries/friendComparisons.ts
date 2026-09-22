import { queryOptions } from '@tanstack/solid-query'
import { fetchFriendComparison } from '../api/friendComparisons'
import type { PlayerDataDifficulty } from '../types/api'
import { FRIEND_QUERY_STALE_TIME_MS } from './friendQueryConstants'

/** フレンドスコア比較のquery key。 */
export const friendComparisonQueryKeys = {
  user: (username: string) => ['friend-comparisons', username] as const,
  comparison: (username: string | null, friend: string | null, difficulty: PlayerDataDifficulty) =>
    ['friend-comparisons', username, friend, difficulty] as const,
}

/**
 * 選択中のフレンドと難易度の比較queryを生成する。
 *
 * @param username - ログインユーザー名。
 * @param friend - 承認済みフレンドのユーザー名。
 * @param difficulty - 大文字の難易度。
 * @returns 比較用query options。
 */
export const friendComparisonQueryOptions = (
  username: string | null,
  friend: string | null,
  difficulty: PlayerDataDifficulty
) =>
  queryOptions({
    queryKey: friendComparisonQueryKeys.comparison(username, friend, difficulty),
    queryFn: ({ signal }) => fetchFriendComparison(friend ?? '', difficulty, signal),
    enabled: Boolean(username && friend),
    staleTime: FRIEND_QUERY_STALE_TIME_MS,
  })
