import type { GoalAttributes, PlayerRecordDTO, SongDTO } from '../../../types/api'

const OVERPOWER_CHART_CONST_BONUS = 3
const OVERPOWER_CHART_MULTIPLIER = 5

/**
 * 譜面定数から譜面別の理論OVER POWERを算出する。
 *
 * @param chartConst - 対象譜面の譜面定数。
 * @returns 譜面別の理論OVER POWER。
 */
export const calculateGoalChartMaxOverPower = (chartConst: number): number =>
  (chartConst + OVERPOWER_CHART_CONST_BONUS) * OVERPOWER_CHART_MULTIPLIER

/**
 * 対象条件に一致する譜面ごとの最大OVER POWER合計を算出する。
 *
 * @param records - 対象条件で抽出済みのプレイヤーレコード。
 * @param songs - 楽曲マスタ一覧。
 * @param attributes - 目標フォームで選択中の対象条件。
 * @returns 対象譜面それぞれの最大OVER POWERを合計した値。
 */
export const calculateGoalOverPowerChartMax = (
  records: PlayerRecordDTO[],
  songs: SongDTO[],
  attributes: GoalAttributes
): number => {
  const songMap = new Map(songs.map((song) => [song.id, song]))
  const countedSongIds = new Set<string>()

  return records.reduce((acc, record) => {
    const song = songMap.get(record.id)
    if (attributes.chart_target === 'OP_TARGET') {
      if (countedSongIds.has(record.id)) return acc
      countedSongIds.add(record.id)
      return acc + (song?.maxop ?? 0)
    }
    return acc + calculateGoalChartMaxOverPower(record.const)
  }, 0)
}
