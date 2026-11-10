import type { PlayerDataDifficulty, SongDTO } from '../types/api'

/**
 * 難易度が楽曲の理論値OVER POWER最大譜面に一致するか判定する。
 *
 * @param targetDifficulty - 楽曲マスタの理論値OVER POWER対象難易度。
 * @param difficulty - 判定対象の難易度。
 * @returns 理論値対象難易度と一致する場合はtrue。
 */
export const isTheoreticalOverPowerTargetDifficulty = (
  targetDifficulty: PlayerDataDifficulty | null | undefined,
  difficulty: PlayerDataDifficulty
): boolean => targetDifficulty === difficulty

/**
 * 楽曲一覧から曲IDごとの理論値OVER POWER対象難易度を構築する。
 *
 * @param songs - 曲IDと理論値対象難易度を含む楽曲一覧。
 * @returns 理論値対象難易度が設定された曲だけを保持するMap。
 */
export const buildTheoreticalOverPowerTargetDifficultyBySongId = (
  songs: readonly Pick<SongDTO, 'id' | 'op_target_difficulty'>[]
): Map<string, PlayerDataDifficulty> => {
  const targetDifficultyBySongId = new Map<string, PlayerDataDifficulty>()

  for (const song of songs) {
    if (song.op_target_difficulty) {
      targetDifficultyBySongId.set(song.id, song.op_target_difficulty)
    }
  }

  return targetDifficultyBySongId
}
