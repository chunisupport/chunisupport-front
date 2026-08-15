import type { PlayerDataDifficulty } from '../../types/api'
import { buildTheoreticalOverPowerTargetDifficultyBySongId } from '../../utils/theoreticalOverPowerTarget'
import { fetchAllSongsWithCache } from '../cache/fetchAllSongsWithCache'

/**
 * 楽曲マスタをカプセル化し、曲IDごとの理論値OVER POWER対象難易度を取得する。
 *
 * @returns 理論値対象難易度が設定された曲だけを保持するMap。
 */
export const fetchTheoreticalTargetDifficultyBySongId = async (): Promise<
  Map<string, PlayerDataDifficulty>
> => {
  const { songs } = await fetchAllSongsWithCache()
  return buildTheoreticalOverPowerTargetDifficultyBySongId(songs)
}
