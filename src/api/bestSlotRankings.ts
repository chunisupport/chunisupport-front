import { API_BASE_URL } from '../config'
import type { BestSlotRankingResponseDTO } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

/** ベスト枠ランキングAPIで1回に取得する件数 */
export const BEST_SLOT_RANKING_PAGE_SIZE = 50

/** ベスト枠ランキング取得条件 */
export type FetchBestSlotRankingOptions = {
  ratingBand: string
  cursor?: string
  limit?: number
}

/**
 * ベスト枠平均レート帯別の譜面採用率ランキングを取得する。
 *
 * @param options - レート帯、カーソル、取得件数。
 * @returns 指定したレート帯のランキング1ページ分。
 */
export const fetchBestSlotRanking = async (
  options: FetchBestSlotRankingOptions
): Promise<BestSlotRankingResponseDTO> => {
  const url = new URL(`${API_BASE_URL}/internal/best-slot-rankings`)
  url.searchParams.set('rating_band', options.ratingBand)
  url.searchParams.set('limit', String(options.limit ?? BEST_SLOT_RANKING_PAGE_SIZE))
  if (options.cursor) url.searchParams.set('cursor', options.cursor)

  const response = await fetchWithAuth(url)
  return response.json()
}
