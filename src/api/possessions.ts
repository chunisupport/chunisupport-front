import type { MasterItemDTO } from '../types/api'
import { fetchMasterData } from './songs'

/**
 * プレイヤー所持状況マスタを取得する。
 *
 * @returns キャッシュ済みマスターデータに含まれる所持状況一覧（ID順）。
 */
export const fetchPossessions = async (): Promise<MasterItemDTO[]> => {
  const masterData = await fetchMasterData()
  return masterData.possessions
}
