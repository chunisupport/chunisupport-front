import type { MasterItemDTO } from '../types/api'
import { fetchMasterData } from './songs'

/**
 * ポゼッションマスタを取得する。
 *
 * @returns キャッシュ済みマスターデータに含まれるポゼッション一覧（ID順）。
 */
export const fetchPossessions = async (): Promise<MasterItemDTO[]> => {
  const masterData = await fetchMasterData()
  return masterData.possessions
}
