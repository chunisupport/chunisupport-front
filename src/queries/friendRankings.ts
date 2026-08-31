import { type QueryClient, queryOptions } from '@tanstack/solid-query'
import {
  fetchSongFriendRanking,
  fetchWorldsendFriendRanking,
  type ScoreHistoryDifficulty,
} from '../api/songs'
import { FRIEND_QUERY_STALE_TIME_MS } from './friendQueryConstants'

/** フレンドランキングqueryのkey factory。 */
export const friendRankingQueryKeys = {
  all: ['friend-rankings'] as const,
  user: (username: string) => ['friend-rankings', username] as const,
  song: (username: string | null, displayId: string, difficulty: ScoreHistoryDifficulty | null) =>
    ['friend-rankings', username, 'song', displayId, difficulty] as const,
  worldsend: (username: string | null, displayId: string) =>
    ['friend-rankings', username, 'worldsend', displayId] as const,
}

/**
 * 通常譜面のフレンドランキングquery optionsを生成する。
 *
 * @param username - 現在の認証ユーザー名。
 * @param displayId - 楽曲表示ID。
 * @param difficulty - 大文字の難易度ドメイン値。
 * @returns 通常譜面ランキング用query options。
 */
export const songFriendRankingQueryOptions = (
  username: string | null,
  displayId: string,
  difficulty: ScoreHistoryDifficulty | null
) => {
  const normalizedDifficulty = difficulty
    ? (difficulty.toUpperCase() as ScoreHistoryDifficulty)
    : null

  return queryOptions({
    queryKey: friendRankingQueryKeys.song(username, displayId, normalizedDifficulty),
    queryFn: ({ signal }) =>
      fetchSongFriendRanking(displayId, normalizedDifficulty ?? 'MASTER', signal),
    enabled: Boolean(username && displayId && normalizedDifficulty),
    staleTime: FRIEND_QUERY_STALE_TIME_MS,
  })
}

/**
 * WORLD'S END譜面のフレンドランキングquery optionsを生成する。
 *
 * @param username - 現在の認証ユーザー名。
 * @param displayId - 楽曲表示ID。
 * @returns WORLD'S ENDランキング用query options。
 */
export const worldsendFriendRankingQueryOptions = (username: string | null, displayId: string) =>
  queryOptions({
    queryKey: friendRankingQueryKeys.worldsend(username, displayId),
    queryFn: ({ signal }) => fetchWorldsendFriendRanking(displayId, signal),
    enabled: Boolean(username && displayId),
    staleTime: FRIEND_QUERY_STALE_TIME_MS,
  })

/**
 * 指定ユーザーの全フレンドランキングqueryを無効化する。
 *
 * @param queryClient - 更新対象のQueryClient。
 * @param username - キャッシュを無効化する認証ユーザー名。
 * @returns 表示中queryの再取得完了時に解決されるPromise。
 */
export const invalidateFriendRankings = (
  queryClient: QueryClient,
  username: string
): Promise<void> =>
  queryClient.invalidateQueries({
    queryKey: friendRankingQueryKeys.user(username),
  })
