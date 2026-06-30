import type { ChartDTO, PlayerDataDifficulty, SongDTO } from '../types/api'

export type MySongSelectionChart = {
  difficulty: PlayerDataDifficulty
  chart: ChartDTO
}

/**
 * 楽曲から指定難易度の譜面情報を取得する。
 *
 * @param song - 譜面情報を持つ楽曲。
 * @param difficulty - 大文字で扱う難易度ドメイン値。
 * @returns 対象難易度の譜面情報。存在しない場合は null。
 */
export const resolveMySongSelectionChart = (
  song: SongDTO | null,
  difficulty: PlayerDataDifficulty
): MySongSelectionChart | null => {
  const chart = song?.charts[difficulty]
  return chart ? { difficulty, chart } : null
}

/**
 * 譜面定数を画像表示用の文字列へ変換する。
 *
 * @param chart - 対象譜面。
 * @param unknownLabel - 定数不明時に表示するラベル。
 * @returns 小数1桁の譜面定数、または不明ラベル。
 */
export const formatMySongSelectionChartConstant = (
  chart: ChartDTO,
  unknownLabel: string
): string => {
  if (chart.is_const_unknown) return unknownLabel

  return chart.const.toFixed(1)
}

/**
 * 選曲候補の上限件数に収まるよう配列を切り出す。
 *
 * @param songs - 絞り込み済みの楽曲一覧。
 * @param limit - 表示上限。
 * @returns 表示上限までの楽曲一覧。
 */
export const limitMySongSelectionCandidates = <T>(songs: readonly T[], limit: number): T[] =>
  songs.slice(0, limit)
