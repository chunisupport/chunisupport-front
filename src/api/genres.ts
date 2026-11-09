import { API_BASE_URL } from '../config'
import type { GenreDTO } from '../types/api'
import { sortMasterItemsBySortOrder } from '../utils/masterData'
import { fetchWithAuth } from './fetchWithAuth'

/**
 * API からジャンル一覧を取得する。
 *
 * @returns 全マスタ取得時と同じ順序に並べたジャンル一覧。
 */
export const requestGenres = async (): Promise<GenreDTO[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/master/genres`)
  const { genres } = (await response.json()) as { genres?: GenreDTO[] }

  return sortMasterItemsBySortOrder(genres ?? [])
}
