import { infiniteQueryOptions } from '@tanstack/solid-query'
import { fetchBestSlotRanking } from '../api/bestSlotRankings'

/** ベスト枠採用率ランキングqueryのkey factory。 */
export const bestSlotRankingQueryKeys = {
  all: ['best-slot-rankings'] as const,
  band: (ratingBand: string | null) => ['best-slot-rankings', ratingBand] as const,
}

/**
 * 指定レート帯のベスト枠採用率ランキングinfinite query optionsを生成する。
 *
 * @param ratingBand - 取得対象のレート帯。未選択時はnull。
 * @returns カーソルページング対応のランキングquery options。
 */
export const bestSlotRankingInfiniteQueryOptions = (ratingBand: string | null) =>
  infiniteQueryOptions({
    queryKey: bestSlotRankingQueryKeys.band(ratingBand),
    queryFn: ({ pageParam, signal }) =>
      fetchBestSlotRanking({
        ratingBand: ratingBand ?? '',
        cursor: pageParam ?? undefined,
        signal,
      }),
    enabled: Boolean(ratingBand),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  })
