import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../../../types/api'
import {
  type buildOverPowerLockedSongLookup,
  buildTheoreticalTargetRecordBySongId,
} from '../../../../usecases/overpower/overpowerGraph'
import type { OverPowerChartEntry, OverPowerDifficulty } from '../../../../usecases/overpower/types'
import { toChartLevelLabel } from '../../../../utils/chartLevel'
import { getScoreRank, MAX_SCORE } from '../../../../utils/scoreRank'
import {
  getShortVersionName,
  resolveVersionNameByReleaseDate,
} from '../../../../utils/versionConverter'
import { OVER_POWER_COMBO_BANDS, OVER_POWER_SCORE_BANDS } from '../constants'
import type { OverPowerComboBand, OverPowerGraphRow, OverPowerScoreBand } from '../types'

type LockedSongLookup = ReturnType<typeof buildOverPowerLockedSongLookup>

export type RecordsBySummaryTab = Record<
  'all' | 'genres' | 'difficulties' | 'levels' | 'versions',
  Map<string, (PlayerRecordDTO | null)[]>
>

type SongGraphEntry = {
  record: PlayerRecordDTO | null
  versionName: string | null
}

export type SongEntriesBySummaryTab = {
  all: Map<string, SongGraphEntry[]>
  genres: Map<string, SongGraphEntry[]>
  versions: Map<string, SongGraphEntry[]>
}

const ULTIMA_DIFFICULTY: OverPowerDifficulty = 'ULTIMA'

/**
 * レコードが未解禁設定の対象外で、OVER POWER集計に含められるかを判定する。
 *
 * @param record - 判定対象のプレイヤーレコード。
 * @param lockedLookup - 未解禁設定の検索セット。
 * @returns OVER POWER集計に含められる場合は true。
 */
export const isRecordAvailable = (
  record: PlayerRecordDTO,
  lockedLookup: LockedSongLookup
): boolean => {
  if (lockedLookup.lockedSongIds.has(record.id)) return false
  return !(
    record.difficulty === ULTIMA_DIFFICULTY && lockedLookup.ultimaLockedSongIds.has(record.id)
  )
}

/**
 * 未解禁設定を反映した曲内の最高譜面定数を取得する。
 *
 * @param song - 対象楽曲。
 * @param lockedLookup - 未解禁設定の検索セット。
 * @returns 利用可能な譜面の最高定数。譜面がない場合は null。
 */
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

/**
 * Map内のレコード配列へ対象レコードを追加する。
 *
 * @param groups - 追加先の分類Map。
 * @param key - 分類キー。
 * @param record - 追加するプレイヤーレコード。
 * @returns なし。
 */
const addRecordToGroup = (
  groups: Map<string, (PlayerRecordDTO | null)[]>,
  key: string,
  record: PlayerRecordDTO | null
): void => {
  const group = groups.get(key) ?? []
  group.push(record)
  groups.set(key, group)
}

/**
 * Map内の曲エントリ配列へ対象曲を追加する。
 *
 * @param groups - 追加先の分類Map。
 * @param key - 分類キー。
 * @param entry - 追加する曲グラフ用エントリ。
 * @returns なし。
 */
const addSongEntryToGroup = (
  groups: Map<string, SongGraphEntry[]>,
  key: string,
  entry: SongGraphEntry
): void => {
  const group = groups.get(key) ?? []
  group.push(entry)
  groups.set(key, group)
}

/**
 * 曲数ベースのグラフ分布を作るため、楽曲を表示タブごとに分類する。
 *
 * @param songs - 集計対象の楽曲一覧。
 * @param records - 未解禁設定で除外済みのプレイヤーレコード一覧。
 * @param versions - リリース日からバージョン名を解決するためのバージョン一覧。
 * @param lockedLookup - 未解禁設定の検索セット。
 * @returns ALL・ジャンル・バージョンごとの曲グラフ用エントリ。
 */
export const buildSongEntriesBySummaryTab = (
  songs: SongDTO[],
  records: PlayerRecordDTO[],
  versions: VersionSummaryDTO[],
  lockedLookup: LockedSongLookup
): SongEntriesBySummaryTab => {
  const targetRecordBySongId = buildTheoreticalTargetRecordBySongId(songs, records, lockedLookup)
  const groups: SongEntriesBySummaryTab = {
    all: new Map(),
    genres: new Map(),
    versions: new Map(),
  }

  for (const song of songs) {
    if (lockedLookup.lockedSongIds.has(song.id)) continue
    if (getHighestAvailableChartConst(song, lockedLookup) === null) continue

    const resolvedVersion = resolveVersionNameByReleaseDate(song.release, versions)
    const baseEntry = {
      versionName: resolvedVersion === '不明' ? null : getShortVersionName(resolvedVersion),
    }
    const allEntry: SongGraphEntry = {
      ...baseEntry,
      record: targetRecordBySongId.get(song.id) ?? null,
    }
    addSongEntryToGroup(groups.all, 'all', allEntry)

    if (song.genre && song.genre !== '不明') {
      addSongEntryToGroup(groups.genres, song.genre, allEntry)
    }

    if (allEntry.versionName) {
      addSongEntryToGroup(groups.versions, allEntry.versionName, allEntry)
    }
  }

  return groups
}

/**
 * グラフのカテゴリ別分布を作るため、レコードを表示タブごとに分類する。
 *
 * @param records - 集計対象のプレイヤーレコード一覧。
 * @param songs - 楽曲マスタ一覧。
 * @param versions - リリース日からバージョン名を解決するためのバージョン一覧。
 * @returns 集計軸ごとのプレイヤーレコード分類Map。
 */
export const buildRecordsBySummaryTab = (
  records: PlayerRecordDTO[],
  songs: SongDTO[],
  versions: VersionSummaryDTO[]
): RecordsBySummaryTab => {
  const songById = new Map(songs.map((song) => [song.id, song]))
  const groups: RecordsBySummaryTab = {
    all: new Map(),
    genres: new Map(),
    difficulties: new Map(),
    levels: new Map(),
    versions: new Map(),
  }

  for (const record of records) {
    const song = songById.get(record.id)
    const levelLabel = toChartLevelLabel(record.const)
    addRecordToGroup(groups.all, 'all', record)
    addRecordToGroup(groups.difficulties, record.difficulty, record)
    addRecordToGroup(groups.levels, levelLabel, record)

    if (song?.genre && song.genre !== '不明') {
      addRecordToGroup(groups.genres, song.genre, record)
    }

    const resolvedVersion = resolveVersionNameByReleaseDate(song?.release ?? null, versions)
    if (resolvedVersion !== '不明') {
      addRecordToGroup(groups.versions, getShortVersionName(resolvedVersion), record)
    }
  }

  return groups
}

/**
 * 未プレイを含む譜面エントリを表示軸ごとに分類する。
 *
 * @param entries - フィルター適用済みの譜面エントリ。
 * @returns 集計軸ごとのレコード分類Map。未プレイ譜面はnullで保持する。
 */
export const buildChartRecordsBySummaryTab = (
  entries: OverPowerChartEntry[]
): RecordsBySummaryTab => {
  const groups: RecordsBySummaryTab = {
    all: new Map(),
    genres: new Map(),
    difficulties: new Map(),
    levels: new Map(),
    versions: new Map(),
  }
  for (const entry of entries) {
    addRecordToGroup(groups.all, 'all', entry.record)
    addRecordToGroup(groups.difficulties, entry.difficulty, entry.record)
    addRecordToGroup(groups.levels, entry.level, entry.record)
    if (entry.song.genre && entry.song.genre !== '不明') {
      addRecordToGroup(groups.genres, entry.song.genre, entry.record)
    }
    if (entry.versionName) {
      addRecordToGroup(groups.versions, entry.versionName, entry.record)
    }
  }
  return groups
}

/**
 * フィルター適用済み譜面から曲数ベースグラフの代表譜面を作る。
 *
 * @param entries - フィルター適用済みの譜面エントリ。
 * @returns ALL・ジャンル・バージョンごとの曲グラフ用エントリ。
 */
export const buildFilteredSongEntriesBySummaryTab = (
  entries: OverPowerChartEntry[]
): SongEntriesBySummaryTab => {
  const entriesBySongId = new Map<string, OverPowerChartEntry[]>()
  for (const entry of entries) {
    const songEntries = entriesBySongId.get(entry.song.id) ?? []
    songEntries.push(entry)
    entriesBySongId.set(entry.song.id, songEntries)
  }

  const groups: SongEntriesBySummaryTab = {
    all: new Map(),
    genres: new Map(),
    versions: new Map(),
  }
  for (const songEntries of entriesBySongId.values()) {
    const target = songEntries.reduce((highest, entry) =>
      entry.chartConst > highest.chartConst ? entry : highest
    )
    const graphEntry: SongGraphEntry = {
      record: target.record,
      versionName: target.versionName,
    }
    addSongEntryToGroup(groups.all, 'all', graphEntry)
    if (target.song.genre && target.song.genre !== '不明') {
      addSongEntryToGroup(groups.genres, target.song.genre, graphEntry)
    }
    if (target.versionName) {
      addSongEntryToGroup(groups.versions, target.versionName, graphEntry)
    }
  }
  return groups
}

/**
 * スコアからグラフ表示用のランク帯を取得する。
 *
 * @param record - 判定対象のプレイヤーレコード。
 * @returns グラフで利用するスコア帯。
 */
const getScoreBand = (record: PlayerRecordDTO | null): OverPowerScoreBand => {
  if (!record) return 'OTHER'
  if (!record.is_played) return 'OTHER'
  if (record.score >= MAX_SCORE) return 'MAX'

  const rank = getScoreRank(record.score)
  if (
    rank === 'SSS+' ||
    rank === 'SSS' ||
    rank === 'SS+' ||
    rank === 'SS' ||
    rank === 'S+' ||
    rank === 'S'
  ) {
    return rank
  }

  return 'OTHER'
}

/**
 * 曲数ベース集計用に、代表レコードがない曲をOTHER扱いでランク帯へ分類する。
 *
 * @param entry - 曲グラフ用エントリ。
 * @returns グラフで利用するスコア帯。
 */
const getSongScoreBand = (entry: SongGraphEntry): OverPowerScoreBand =>
  entry.record ? getScoreBand(entry.record) : 'OTHER'

/**
 * コンボランプからグラフ表示用のランプ帯を取得する。
 *
 * @param record - 判定対象のプレイヤーレコード。
 * @returns グラフで利用するコンボ帯。
 */
const getComboBand = (record: PlayerRecordDTO | null): OverPowerComboBand => {
  if (!record) return 'OTHER'
  if (record.combo_lamp === 'ALL JUSTICE') return 'ALL JUSTICE'
  if (record.combo_lamp === 'FULL COMBO') return 'FULL COMBO'
  return 'OTHER'
}

/**
 * 曲数ベース集計用に、代表レコードがない曲をOTHER扱いでランプ帯へ分類する。
 *
 * @param entry - 曲グラフ用エントリ。
 * @returns グラフで利用するコンボ帯。
 */
const getSongComboBand = (entry: SongGraphEntry): OverPowerComboBand =>
  entry.record ? getComboBand(entry.record) : 'OTHER'

/**
 * グラフ表示に必要なランク・コンボ分布をサマリー行へ付与する。
 *
 * @param rows - グラフ表示対象のサマリー行。
 * @param recordsByLabel - サマリー行IDまたはラベルに紐づくレコード分類Map。
 * @returns ランク・コンボ分布を付与したグラフ行。
 */
export const buildGraphRows = (
  rows: OverPowerGraphRow['summary'][],
  recordsByLabel: Map<string, (PlayerRecordDTO | null)[]>
): OverPowerGraphRow[] =>
  rows.map((summary) => {
    const records = recordsByLabel.get(summary.id) ?? recordsByLabel.get(summary.label) ?? []
    return {
      summary,
      scoreBands: OVER_POWER_SCORE_BANDS.map((label) => ({
        label,
        count: records.filter((record) => getScoreBand(record) === label).length,
      })),
      comboBands: OVER_POWER_COMBO_BANDS.map((label) => ({
        label,
        count: records.filter((record) => getComboBand(record) === label).length,
      })),
    }
  })

/**
 * 曲数ベースのランク・コンボ分布をサマリー行へ付与する。
 *
 * @param rows - グラフ表示対象のサマリー行。
 * @param entriesByLabel - サマリー行IDまたはラベルに紐づく曲エントリ分類Map。
 * @returns ランク・コンボ分布を付与したグラフ行。
 */
export const buildSongBasedGraphRows = (
  rows: OverPowerGraphRow['summary'][],
  entriesByLabel: Map<string, SongGraphEntry[]>
): OverPowerGraphRow[] =>
  rows.map((summary) => {
    const entries = entriesByLabel.get(summary.id) ?? entriesByLabel.get(summary.label) ?? []
    return {
      summary,
      scoreBands: OVER_POWER_SCORE_BANDS.map((label) => ({
        label,
        count: entries.filter((entry) => getSongScoreBand(entry) === label).length,
      })),
      comboBands: OVER_POWER_COMBO_BANDS.map((label) => ({
        label,
        count: entries.filter((entry) => getSongComboBand(entry) === label).length,
      })),
    }
  })
