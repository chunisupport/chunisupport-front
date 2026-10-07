import type { NameFolderDTO } from '../types/api'
import { fetchMasterData } from './songs'

/**
 * 楽曲名順フォルダマスタを取得する。
 *
 * @returns キャッシュ済みマスターデータに含まれる楽曲名順フォルダ一覧（sort_order昇順）。
 */
export const fetchNameFolders = async (): Promise<NameFolderDTO[]> => {
  const masterData = await fetchMasterData()
  return masterData.name_folders
}
