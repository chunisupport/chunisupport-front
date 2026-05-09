import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../types/api'
import {
  type ChartLevelLabel,
  getChartLevelSortKey,
  isLowChartLevel,
  toChartLevelLabel,
} from '../../utils/chartLevel'
import { getShortVersionName, resolveVersionNameByReleaseDate } from '../../utils/versionConverter'
import type {
  OverPowerDifficulty,
  OverPowerLevelSummaryRow,
  OverPowerSummary,
  OverPowerSummaryRow,
} from './types'

const DIFFICULTY_ORDER: OverPowerDifficulty[] = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA']

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

const getHighestChartConst = (song: SongDTO): number | null => {
  const chartConsts = Object.values(song.charts)
    .map((chart) => chart?.const)
    .filter((chartConst): chartConst is number => typeof chartConst === 'number')
  if (chartConsts.length === 0) return null
  return Math.max(...chartConsts)
}

const buildSongEntries = (
  songs: SongDTO[],
  records: PlayerRecordDTO[],
  versions: VersionSummaryDTO[]
): SongAggregationEntry[] => {
  const maxRecordOpBySongId = new Map<string, number>()
  for (const record of records) {
    const current = maxRecordOpBySongId.get(record.id) ?? 0
    if (record.overpower > current) {
      maxRecordOpBySongId.set(record.id, record.overpower)
    }
  }

  return songs.map((song) => {
    const highestConst = getHighestChartConst(song)
    const resolvedVersion = resolveVersionNameByReleaseDate(song.release, versions)
    return {
      song,
      current: maxRecordOpBySongId.get(song.id) ?? 0,
      max: song.maxop,
      level: highestConst === null ? null : toChartLevelLabel(highestConst),
      versionName: resolvedVersion === '不明' ? null : getShortVersionName(resolvedVersion),
    }
  })
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

const buildGenreSummaries = (entries: SongAggregationEntry[]): OverPowerSummaryRow[] => {
  const groups = new Map<string, MutableSummary>()
  for (const entry of entries) {
    if (!entry.song.genre || entry.song.genre === '不明') continue
    addToGroup(groups, entry.song.genre, entry.current, entry.max)
  }

  return [...groups.entries()]
    .map(([label, summary]) => toSummaryRow(label, label, summary))
    .filter((row) => row.max > 0)
    .sort((a, b) => a.label.localeCompare(b.label, 'ja'))
}

const buildLevelSummaries = (entries: SongAggregationEntry[]): OverPowerLevelSummaryRow[] => {
  const groups = new Map<ChartLevelLabel, MutableSummary>()
  for (const entry of entries) {
    if (!entry.level) continue
    addToGroup(groups, entry.level, entry.current, entry.max)
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
  versions: VersionSummaryDTO[]
): OverPowerSummary => {
  const entries = buildSongEntries(songs, records, versions)

  return {
    all: buildAllSummary(entries),
    genres: buildGenreSummaries(entries),
    levels: buildLevelSummaries(entries),
    versions: buildVersionSummaries(entries, versions),
    difficulties: buildDifficultySummaries(records),
  }
}
