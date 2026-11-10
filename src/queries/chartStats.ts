import { queryOptions } from '@tanstack/solid-query'
import { fetchChartStats } from '../api/chartStats'
import { appQueryClient } from '../lib/queryClient'
import type { ChartStatsDifficulty, ChartStatsResponse } from '../types/chartStats'

/** 静的統計JSONを再取得せず使い回す時間。集計は定期バッチで更新されるため短時間の再取得は不要 */
const CHART_STATS_STALE_TIME_MS = 10 * 60 * 1000

/** レコード統計queryのkey factory。 */
export const chartStatsQueryKeys = {
  all: ['chart-stats'] as const,
  difficulty: (difficulty: ChartStatsDifficulty) =>
    [...chartStatsQueryKeys.all, difficulty] as const,
}

/**
 * 指定難易度のレコード統計query optionsを生成する。
 *
 * @param difficulty - 取得する難易度。
 * @returns 静的統計JSON用query options。
 */
export const chartStatsQueryOptions = (difficulty: ChartStatsDifficulty) =>
  queryOptions({
    queryKey: chartStatsQueryKeys.difficulty(difficulty),
    queryFn: ({ signal }) => fetchChartStats(difficulty, signal),
    staleTime: CHART_STATS_STALE_TIME_MS,
  })

/**
 * 複数難易度のレコード統計を、取得済みのものはキャッシュから使って並列に取得する。
 *
 * @param difficulties - 取得する難易度。
 * @returns 指定順に並べた静的統計JSON。
 * @throws いずれかの難易度の取得に失敗した場合。
 */
export const fetchChartStatsList = (
  difficulties: readonly ChartStatsDifficulty[]
): Promise<ChartStatsResponse[]> =>
  Promise.all(
    difficulties.map((difficulty) => appQueryClient.fetchQuery(chartStatsQueryOptions(difficulty)))
  )
