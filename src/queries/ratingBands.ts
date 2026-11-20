import { queryOptions } from '@tanstack/solid-query'
import type { RatingBandDTO } from '../types/api'
import { fetchMasterData } from './masterData'

/** レーティング帯queryのkey factory。 */
export const ratingBandQueryKeys = {
  /** @returns ベスト枠平均レーティング帯一覧のqueryキー。 */
  all: () => ['master', 'rating-bands'] as const,
}

/**
 * ベスト枠平均レーティング帯のマスター一覧を取得する。
 *
 * @returns キャッシュ済みマスターデータに含まれるレーティング帯一覧。
 */
export const fetchRatingBands = async (): Promise<RatingBandDTO[]> => {
  const masterData = await fetchMasterData()
  return masterData.rating_bands
}

/**
 * ベスト枠平均レーティング帯のマスター一覧を取得するquery optionsを生成する。
 *
 * @returns セッション中に再利用するレーティング帯一覧のquery options。
 */
export const ratingBandsQueryOptions = () =>
  queryOptions({
    queryKey: ratingBandQueryKeys.all(),
    queryFn: fetchRatingBands,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    networkMode: 'always',
  })
