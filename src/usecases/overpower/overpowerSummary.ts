import type { MasterItemDTO, PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../types/api'
import { type ChartLevelLabel, getChartLevelSortKey, isLowChartLevel } from '../../utils/chartLevel'
import { compareMasterItemNames, createMasterItemOrderMap } from '../../utils/masterData'
import { getShortVersionName } from '../../utils/versionConverter'
import { buildOverPowerChartEntries, selectOverPowerChartEntries } from './aggregation'
import type {
  OverPowerAggregationTarget,
  OverPowerChartEntry,
  OverPowerLevelSummaryRow,
  OverPowerLockedSong,
  OverPowerSummary,
  OverPowerSummaryRow,
} from './types'

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

const buildAllSummary = (entries: OverPowerChartEntry[]): OverPowerSummaryRow => {
  const summary = entries.reduce(
    (acc, entry) => ({
      current: acc.current + (entry.record?.overpower ?? 0),
      max: acc.max + entry.maxOverPower,
      count: acc.count + 1,
    }),
    emptyMutableSummary()
  )

  return toSummaryRow('all', 'ALL', summary)
}

const buildGenreSummaries = (
  entries: OverPowerChartEntry[],
  genres?: MasterItemDTO[]
): OverPowerSummaryRow[] => {
  const groups = new Map<string, MutableSummary>()
  const genreOrderMap = createMasterItemOrderMap(genres)
  for (const entry of entries) {
    if (!entry.song.genre || entry.song.genre === '不明') continue
    addToGroup(groups, entry.song.genre, entry.record?.overpower ?? 0, entry.maxOverPower)
  }

  return [...groups.entries()]
    .map(([label, summary]) => toSummaryRow(label, label, summary))
    .filter((row) => row.max > 0)
    .sort((a, b) => compareMasterItemNames(a.label, b.label, genreOrderMap))
}

const buildLevelSummaries = (entries: OverPowerChartEntry[]): OverPowerLevelSummaryRow[] => {
  const groups = new Map<ChartLevelLabel, MutableSummary>()
  for (const entry of entries) {
    addToGroup(groups, entry.level, entry.record?.overpower ?? 0, entry.maxOverPower)
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
  entries: OverPowerChartEntry[],
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
    addToGroup(groups, entry.versionName, entry.record?.overpower ?? 0, entry.maxOverPower)
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

/**
 * 指定した対象と未解禁設定を反映したOVER POWERサマリーを構築する。
 *
 * @param songs - 楽曲マスタ一覧。
 * @param records - ユーザーの全譜面レコード。
 * @param versions - バージョン一覧。
 * @param lockedSongs - 集計から除外する未解禁曲・譜面。
 * @param genres - ジャンルの表示順に使うマスタ。
 * @param target - 集計対象。
 * @returns 全体・ジャンル・レベル・バージョン別の集計結果。
 */
export const buildOverPowerSummary = (
  songs: SongDTO[],
  records: PlayerRecordDTO[],
  versions: VersionSummaryDTO[],
  lockedSongs: OverPowerLockedSong[] = [],
  genres?: MasterItemDTO[],
  target: OverPowerAggregationTarget = 'OP_TARGET'
): OverPowerSummary => {
  const allChartEntries = buildOverPowerChartEntries(songs, records, versions, lockedSongs)
  const chartEntries = selectOverPowerChartEntries(allChartEntries, target)

  return {
    all: buildAllSummary(chartEntries),
    genres: buildGenreSummaries(chartEntries, genres),
    levels: buildLevelSummaries(chartEntries),
    versions: buildVersionSummaries(chartEntries, versions),
  }
}
