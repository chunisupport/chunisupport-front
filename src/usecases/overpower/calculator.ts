import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../types/api'
import {
  calculatePlayedAverageScore,
  calculatePlayedAverageScoreByConst,
  type OverPowerCalculatorBase,
  type UnplayedOverPowerEntry,
} from '../../utils/overPowerCalculator'
import { buildOverPowerChartEntries, selectOverPowerChartEntries } from './aggregation'
import type { OverPowerChartEntry, OverPowerLockedSong } from './types'

/** 自動入力と未プレイ補完で共有する集計データ。 */
export type OverPowerCalculatorData = OverPowerCalculatorBase & {
  unplayedEntries: UnplayedOverPowerEntry[]
  playedAverageScore: number | null
  playedAverageScoreByConst: Map<number, number>
}

/**
 * 現行の集計対象・未解禁設定を使って計算機の基準値を構築する。
 * 未プレイは、利用可能な理論値対象譜面が未プレイである曲として判定する。
 *
 * @param songs - 通常楽曲一覧。
 * @param records - ユーザーの通常譜面レコード。
 * @param versions - バージョン一覧。
 * @param lockedSongs - 計算から除外する未解禁設定。
 * @returns 自動入力値、曲別補完データ、既プレイ平均と定数別平均。
 */
export const buildOverPowerCalculatorData = (
  songs: SongDTO[],
  records: PlayerRecordDTO[],
  versions: VersionSummaryDTO[],
  lockedSongs: OverPowerLockedSong[]
): OverPowerCalculatorData => {
  const entries = buildOverPowerChartEntries(songs, records, versions, lockedSongs)
  const currentTargets = selectOverPowerChartEntries(entries, 'OP_TARGET')
  const entriesBySong = new Map<string, OverPowerChartEntry[]>()
  for (const entry of entries) {
    const songEntries = entriesBySong.get(entry.song.id) ?? []
    songEntries.push(entry)
    entriesBySong.set(entry.song.id, songEntries)
  }
  const unplayedEntries = currentTargets.map((currentTarget) => {
    const candidates = entriesBySong.get(currentTarget.song.id) ?? []
    const theoreticalTarget =
      candidates.find((entry) => entry.difficulty === entry.song.op_target_difficulty) ??
      candidates.reduce((highest, entry) =>
        entry.chartConst > highest.chartConst ? entry : highest
      )
    return {
      current: currentTarget.record?.overpower ?? 0,
      max: currentTarget.maxOverPower,
      targetConst: theoreticalTarget.chartConst,
      isUnplayed: !theoreticalTarget.record?.is_played,
    }
  })
  const playedRecords = currentTargets.flatMap((entry) => (entry.record ? [entry.record] : []))
  const playedAverageScoreByConst = calculatePlayedAverageScoreByConst(playedRecords)
  return {
    max: unplayedEntries.reduce((sum, entry) => sum + entry.max, 0),
    current: unplayedEntries.reduce((sum, entry) => sum + entry.current, 0),
    unplayedEntries,
    playedAverageScore: calculatePlayedAverageScore(playedRecords),
    playedAverageScoreByConst,
  }
}
