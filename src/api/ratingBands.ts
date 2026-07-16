import type { RatingBandDTO } from '../types/api'
import { fetchMasterData } from './songs'

/**
 * ベスト枠平均レーティング帯のマスター一覧を取得する。
 *
 * @returns キャッシュ済みマスターデータに含まれるレーティング帯一覧。
 */
export const fetchRatingBands = async (): Promise<RatingBandDTO[]> => {
  const masterData = await fetchMasterData()
  return masterData.rating_bands
}
