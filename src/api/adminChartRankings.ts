import { API_BASE_URL } from '../config'
import type { AdminChartRankingResponseDTO } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

/** 管理者向け譜面ランキングの取得条件 */
export type FetchAdminChartRankingOptions = {
  displayId: string
  difficulty?: string
  signal?: AbortSignal
}

/**
 * 管理者向け譜面ランキングを取得する。
 *
 * @param options - 楽曲表示ID、通常譜面の難易度、キャンセルシグナル。
 * @returns 通常譜面またはWORLD'S END譜面のランキング。
 */
export const fetchAdminChartRanking = async (
  options: FetchAdminChartRankingOptions
): Promise<AdminChartRankingResponseDTO> => {
  const encodedDisplayId = encodeURIComponent(options.displayId)
  const path = options.difficulty
    ? `/internal/admin/chart-rankings/songs/${encodedDisplayId}/charts/${options.difficulty}`
    : `/internal/admin/chart-rankings/worldsend-songs/${encodedDisplayId}`
  const response = await fetchWithAuth(`${API_BASE_URL}${path}`, { signal: options.signal })

  return response.json()
}
