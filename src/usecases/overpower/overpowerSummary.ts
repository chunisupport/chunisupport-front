import type { MasterItemDTO, PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../types/api.ts'
import {
  type ChartLevelLabel,
  getChartLevelSortKey,
  isLowChartLevel,
  toChartLevelLabel,
} from '../../utils/chartLevel.ts'
import { compareMasterItemNames, createMasterItemOrderMap } from '../../utils/masterData.ts'
import { getShortVersionName, resolveVersionNameByReleaseDate } from '../../utils/versionConverter.ts'
import { buildCurrentOverPowerBySongId } from './currentOpTarget.ts'
import type {
  OverPowerDifficulty,
  OverPowerLevelSummaryRow,
  OverPowerLockedSong,
  OverPowerSummary,
  OverPowerSummaryRow,
} from './types.ts'

const DIFFICULTY_ORDER: OverPowerDifficulty[] = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA']
const ULTIMA_DIFFICULTY: OverPowerDifficulty = 'ULTIMA'

type SongAggregationEntry = {
  song: SongDTO
  current: number
  max: number
  level: ChartLevelLabel | null
  versionName: string | null
}

type MutableSummary = {
  current: number
  max: number
  count: number
}

type LockedSongLookup = {
  lockedSongIds: Set<string>
  ultimaLockedSongIds: Set<string>
}

const emptyMutableSummary = (): MutableSummary => ({
  current: 0,
  max: 0,
  count: 0,
})

const calcPercent = (current: number, max: number): number => (max > 0 ? (current / max) * 100 : 0)

const toSummaryRow = (id: string, label: string, summary: MutableSummary): OverPowerSummaryRow => ({
  id,
  label,
  current: summary.current,
  max: summary.max,
  percent: calcPercent(summary.current, summary.max),
  count: summary.count,
})

const addToGroup = (
  groups: Map<string, MutableSummary>,
  key: string,
  current: number,
  max: number
) => {
  const summary = groups.get(key) ?? emptyMutableSummary()
  summary.current += current
  summary.max += max
  summary.count += 1
  groups.set(key, summary)
}

const getHighestAvailableChartConst = (
  song: SongDTO,
  lockedLookup: LockedSongLookup
): number | null => {
  const chartEntries = Object.entries(song.charts) as [
    OverPowerDifficulty,
    SongDTO['charts'][OverPowerDifficulty],
  ][]
  const chartConsts = chartEntries
    .filter(
      ([difficulty]) =>
        !(difficulty === ULTIMA_DIFFICULTY && lockedLookup.ultimaLockedSongIds.has(song.id))
    )
    .map(([, chart]) => chart?.const)
    .filter((chartConst): chartConst is number => typeof chartConst === 'number')
  if (chartConsts.length === 0) return null
  return Math.max(...chartConsts)
}

const getAvailableSongMaxOverPower = (song: SongDTO, lockedLookup: LockedSongLookup): number => {
  if (!lockedLookup.ultimaLockedSongIds.has(song.id)) return song.maxop

  const highestConst = getHighestAvailableChartConst(song, lockedLookup)
  return highestConst === null ? 0 : (highestConst + 3) * 5
}

const buildLockedSongLookup = (lockedSongs: OverPowerLockedSong[]): LockedSongLookup => {
  const lockedSongIds = new Set<string>()
  const ultimaLockedSongIds = new Set<string>()

  for (const lockedSong of lockedSongs) {
    if (lockedSong.is_ultima) {
      ultimaLockedSongIds.add(lockedSong.display_id)
    } else {
      lockedSongIds.add(lockedSong.display_id)
    }
  }

  return { lockedSongIds, ultimaLockedSongIds }
}

const isRecordAvailable = (record: PlayerRecordDTO, lockedLookup: LockedSongLookup): boolean => {
  if (lockedLookup.lockedSongIds.has(record.id)) return false
  return !(
    record.difficulty === ULTIMA_DIFFICULTY && lockedLookup.ultimaLockedSongIds.has(record.id)
  )
}

/**
 * 曲単位のOVER POWERサマリー集計行を作る。
 *
 * @param songs - 集計対象の楽曲マスタ一覧。
 * @param records - 未解禁設定を反映済みのプレイヤーレコード一覧。
 * @param versions - リリース日からバージョン名を解決するための一覧。
 * @param lockedLookup - 未解禁曲とULTIMA未解禁曲の判定用セット。
 * @returns ALL・ジャンル・バージョン集計で使う曲単位の集計行。
 */
const buildSongEntries = (
  songs: SongDTO[],
  records: PlayerRecordDTO[],
  versions: VersionSummaryDTO[],
  lockedLookup: LockedSongLookup
): SongAggregationEntry[] => {
  const currentOpTargetBySongId = buildCurrentOverPowerBySongId(records)

  return songs
    .filter((song) => !lockedLookup.lockedSongIds.has(song.id))
    .map((song) => {
      const highestConst = getHighestAvailableChartConst(song, lockedLookup)
      const resolvedVersion = resolveVersionNameByReleaseDate(song.release, versions)
      return {
        song,
        current: currentOpTargetBySongId.get(song.id) ?? 0,
        max: getAvailableSongMaxOverPower(song, lockedLookup),
        level: highestConst === null ? null : toChartLevelLabel(highestConst),
        versionName: resolvedVersion === '不明' ? null : getShortVersionName(resolvedVersion),
      }
    })
    .filter((entry) => entry.max > 0)
}

const buildAllSummary = (entries: SongAggregationEntry[]): OverPowerSummaryRow => {
  const summary = entries.reduce(
    (acc, entry) => ({
      current: acc.current + entry.current,
      max: acc.max + entry.max,
      count: acc.count + 1,
    }),
    emptyMutableSummary()
  )

  return toSummaryRow('all', 'ALL', summary)
}

const buildGenreSummaries = (
  entries: SongAggregationEntry[],
  genres?: MasterItemDTO[]
): OverPowerSummaryRow[] => {
  const groups = new Map<string, MutableSummary>()
  const genreOrderMap = createMasterItemOrderMap(genres)
  for (const entry of entries) {
    if (!entry.song.genre || entry.song.genre === '不明') continue
    addToGroup(groups, entry.song.genre, entry.current, entry.max)
  }

  return [...groups.entries()]
    .map(([label, summary]) => toSummaryRow(label, label, summary))
    .filter((row) => row.max > 0)
    .sort((a, b) => compareMasterItemNames(a.label, b.label, genreOrderMap))
}

const buildLevelSummaries = (records: PlayerRecordDTO[]): OverPowerLevelSummaryRow[] => {
  const groups = new Map<ChartLevelLabel, MutableSummary>()
  for (const record of records) {
    const level = toChartLevelLabel(record.const)
    addToGroup(groups, level, record.overpower, (record.const + 3) * 5)
  }

  return [...groups.entries()]
    .map(([level, summary]) => ({
      ...toSummaryRow(level, level, summary),
      level,
      isLowLevel: isLowChartLevel(level),
    }))
    .filter((row) => row.max > 0)
    .sort((a, b) => getChartLevelSortKey(a.level) - getChartLevelSortKey(b.level))
}

const buildVersionSummaries = (
  entries: SongAggregationEntry[],
  versions: VersionSummaryDTO[]
): OverPowerSummaryRow[] => {
  const groups = new Map<string, MutableSummary>()
  const versionOrder = new Map(
    [...versions]
      .sort((a, b) => a.released_at.localeCompare(b.released_at, 'ja'))
      .map((version, index) => [getShortVersionName(version.name), index])
  )
  for (const entry of entries) {
    if (!entry.versionName) continue
    addToGroup(groups, entry.versionName, entry.current, entry.max)
  }

  return [...groups.entries()]
    .map(([label, summary]) => toSummaryRow(label, label, summary))
    .filter((row) => row.max > 0)
    .sort((a, b) => {
      const leftOrder = versionOrder.get(a.label) ?? Number.MAX_SAFE_INTEGER
      const rightOrder = versionOrder.get(b.label) ?? Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return a.label.localeCompare(b.label, 'ja')
    })
}

const buildDifficultySummaries = (records: PlayerRecordDTO[]): OverPowerSummaryRow[] => {
  const groups = new Map<OverPowerDifficulty, MutableSummary>()
  for (const record of records) {
    const summary = groups.get(record.difficulty) ?? emptyMutableSummary()
    summary.current += record.overpower
    summary.max += (record.const + 3) * 5
    summary.count += 1
    groups.set(record.difficulty, summary)
  }

  return DIFFICULTY_ORDER.map((difficulty) => {
    const summary = groups.get(difficulty) ?? emptyMutableSummary()
    return toSummaryRow(difficulty, difficulty, summary)
  }).filter((row) => row.max > 0)
}

export const buildOverPowerSummary = (
  songs: SongDTO[],
  records: PlayerRecordDTO[],
  versions: VersionSummaryDTO[],
  lockedSongs: OverPowerLockedSong[] = [],
  genres?: MasterItemDTO[]
): OverPowerSummary => {
  const lockedLookup = buildLockedSongLookup(lockedSongs)
  const availableRecords = records.filter((record) => isRecordAvailable(record, lockedLookup))
  const entries = buildSongEntries(songs, availableRecords, versions, lockedLookup)

  return {
    all: buildAllSummary(entries),
    genres: buildGenreSummaries(entries, genres),
    levels: buildLevelSummaries(availableRecords),
    versions: buildVersionSummaries(entries, versions),
    difficulties: buildDifficultySummaries(availableRecords),
  }
}
