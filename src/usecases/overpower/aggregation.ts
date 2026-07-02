import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../types/api'
import { toChartLevelLabel } from '../../utils/chartLevel'
import { getShortVersionName, resolveVersionNameByReleaseDate } from '../../utils/versionConverter'
import type {
  OverPowerAggregationTarget,
  OverPowerChartEntry,
  OverPowerDifficulty,
  OverPowerLockedSong,
} from './types'

/** OVER POWERで扱う難易度の表示順。 */
export const OVER_POWER_DIFFICULTIES: OverPowerDifficulty[] = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
  'ULTIMA',
]

type LockedSongLookup = {
  lockedSongIds: Set<string>
  ultimaLockedSongIds: Set<string>
}

/**
 * 未解禁設定を検索用セットへ変換する。
 *
 * @param lockedSongs - ユーザーの未解禁楽曲設定。
 * @returns 通常未解禁とULTIMA未解禁を分けた検索セット。
 */
const buildLockedSongLookup = (lockedSongs: OverPowerLockedSong[]): LockedSongLookup => {
  const lockedSongIds = new Set<string>()
  const ultimaLockedSongIds = new Set<string>()
  for (const lockedSong of lockedSongs) {
    const target = lockedSong.is_ultima ? ultimaLockedSongIds : lockedSongIds
    target.add(lockedSong.display_id)
  }
  return { lockedSongIds, ultimaLockedSongIds }
}

/**
 * 楽曲マスタを基準に未プレイを含む譜面エントリを生成する。
 *
 * @param songs - 楽曲マスタ一覧。
 * @param records - プレイヤーレコード一覧。
 * @param versions - バージョン一覧。
 * @param lockedSongs - 未解禁楽曲設定。
 * @returns 利用可能な全譜面の集計エントリ。
 */
export const buildOverPowerChartEntries = (
  songs: SongDTO[],
  records: PlayerRecordDTO[],
  versions: VersionSummaryDTO[],
  lockedSongs: OverPowerLockedSong[] = []
): OverPowerChartEntry[] => {
  const lockedLookup = buildLockedSongLookup(lockedSongs)
  const recordByKey = new Map(
    records.map((record) => [`${record.id}:${record.difficulty}`, record])
  )
  const entries: OverPowerChartEntry[] = []

  for (const song of songs) {
    if (lockedLookup.lockedSongIds.has(song.id)) continue
    const resolvedVersion = resolveVersionNameByReleaseDate(song.release, versions)
    const versionName = resolvedVersion === '不明' ? null : getShortVersionName(resolvedVersion)

    for (const difficulty of OVER_POWER_DIFFICULTIES) {
      const chart = song.charts[difficulty]
      if (!chart) continue
      if (difficulty === 'ULTIMA' && lockedLookup.ultimaLockedSongIds.has(song.id)) continue
      entries.push({
        song,
        difficulty,
        chartConst: chart.const,
        maxOverPower: (chart.const + 3) * 5,
        level: toChartLevelLabel(chart.const),
        versionName,
        record: recordByKey.get(`${song.id}:${difficulty}`) ?? null,
      })
    }
  }

  return entries
}

/**
 * 譜面エントリから選択された集計対象を抽出する。
 *
 * @param entries - 抽出前の全譜面エントリ。
 * @param target - OVER POWER対象、指定難易度、または全難易度。
 * @returns 選択された集計対象に合致する譜面エントリ。
 */
export const selectOverPowerChartEntries = (
  entries: OverPowerChartEntry[],
  target: OverPowerAggregationTarget
): OverPowerChartEntry[] => {
  if (target === 'ALL') return entries

  if (target !== 'OP_TARGET') {
    return entries.filter((entry) => entry.difficulty === target)
  }

  const entriesBySongId = new Map<string, OverPowerChartEntry[]>()
  for (const entry of entries) {
    const songEntries = entriesBySongId.get(entry.song.id) ?? []
    songEntries.push(entry)
    entriesBySongId.set(entry.song.id, songEntries)
  }

  return [...entriesBySongId.values()].map((songEntries) => {
    const flaggedEntries = songEntries.filter((entry) => entry.record?.is_op_target)
    const candidates = flaggedEntries.length > 0 ? flaggedEntries : songEntries
    const opTargetDifficulty = songEntries[0].song.op_target_difficulty
    const targetEntry = candidates.reduce((highest, entry) => {
      const overpowerDifference = (entry.record?.overpower ?? 0) - (highest.record?.overpower ?? 0)
      if (overpowerDifference !== 0) return overpowerDifference > 0 ? entry : highest

      const entryIsTheoreticalTarget = entry.difficulty === opTargetDifficulty
      const highestIsTheoreticalTarget = highest.difficulty === opTargetDifficulty
      if (entryIsTheoreticalTarget !== highestIsTheoreticalTarget) {
        return entryIsTheoreticalTarget ? entry : highest
      }

      return entry.maxOverPower > highest.maxOverPower ? entry : highest
    })
    const availableMax = Math.max(...songEntries.map((entry) => entry.maxOverPower))
    const songChartMax = Math.max(
      ...Object.values(targetEntry.song.charts)
        .filter((chart): chart is NonNullable<typeof chart> => Boolean(chart))
        .map((chart) => (chart.const + 3) * 5)
    )
    return {
      ...targetEntry,
      maxOverPower: availableMax === songChartMax ? targetEntry.song.maxop : availableMax,
    }
  })
}
