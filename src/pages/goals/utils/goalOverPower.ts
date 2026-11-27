import type { GoalAttributes, PlayerRecordDTO, SongDTO, VersionDTO } from '../../../types/api'
import {
  buildOverPowerChartEntries,
  selectOverPowerChartEntries,
} from '../../../usecases/overpower/aggregation'
import type { OverPowerChartEntry, OverPowerLockedSong } from '../../../usecases/overpower/types'
import {
  isGoalNameFolderMatched,
  normalizeGoalAttributeValues,
  normalizeGoalDifficultyNames,
} from '../../../utils/goalAttributes'
import { resolveGoalVersionIdByReleaseDate } from '../../../utils/goalVersion'

/** OVER POWER目標の現在値と理論値 */
export interface GoalOverPowerTotals {
  /** 未解禁設定と目標条件を反映した集計対象譜面数。 */
  targetCount: number
  /** 対象譜面の現在OVER POWER合計 */
  current: number
  /** 対象譜面の理論OVER POWER合計 */
  max: number
  /** 理論値が不明な楽曲が含まれるか */
  hasUnknownMaxOp: boolean
}

/** OVER POWER目標の集計に必要な入力 */
export interface GoalOverPowerCalculationInput {
  /** プレイヤーレコード一覧 */
  records: PlayerRecordDTO[]
  /** 楽曲マスタ一覧 */
  songs: SongDTO[]
  /** 公開ID付きのバージョン一覧 */
  versions: VersionDTO[]
  /** 目標の対象条件 */
  attributes: GoalAttributes
  /** 未解禁楽曲設定。未指定なら除外しない */
  lockedSongs?: OverPowerLockedSong[]
}

/**
 * 未解禁設定を反映した残譜面から、楽曲の理論OP対象譜面定数を解決する。
 *
 * @param songEntries - 同一曲の残譜面エントリ。
 * @returns 理論OP対象譜面の定数。対象譜面が未解禁なら残譜面の最大定数。
 */
const resolveRemainingTheoreticalChartConst = (songEntries: OverPowerChartEntry[]): number => {
  const theoreticalDifficulty = songEntries[0]?.song.op_target_difficulty
  const theoreticalEntry = theoreticalDifficulty
    ? songEntries.find((entry) => entry.difficulty === theoreticalDifficulty)
    : undefined
  if (theoreticalEntry) return theoreticalEntry.chartConst
  return Math.max(...songEntries.map((entry) => entry.chartConst))
}

/**
 * 目標属性のジャンル・バージョン・楽曲名順・定数が楽曲に一致するか判定する。
 *
 * @param song - 判定対象の楽曲。
 * @param chartConst - 条件比較に使う譜面定数。
 * @param attributes - 目標の対象条件。
 * @param genreNames - 対象ジャンル名。
 * @param versionIds - 対象バージョンの公開ID。
 * @param nameFolderCodes - 対象楽曲名順フォルダのコード。
 * @param versions - バージョン一覧。
 * @returns 条件に一致する場合はtrue。
 */
const isSongMatchedByGoalAttributes = (
  song: SongDTO,
  chartConst: number,
  attributes: GoalAttributes,
  genreNames: Set<string> | undefined,
  versionIds: string[] | undefined,
  nameFolderCodes: string[] | undefined,
  versions: VersionDTO[]
): boolean => {
  const constMin = attributes.const?.min
  const constMax = attributes.const?.max
  if (typeof constMin === 'number' && chartConst < constMin) return false
  if (typeof constMax === 'number' && chartConst > constMax) return false
  if (genreNames && (!song.genre || !genreNames.has(song.genre))) return false
  if (!isGoalNameFolderMatched(song.name_folder_code, nameFolderCodes)) return false
  if (versionIds && versionIds.length > 0) {
    const songVersionId = resolveGoalVersionIdByReleaseDate(song.release, versions)
    if (!songVersionId || !versionIds.includes(songVersionId)) return false
  }
  return true
}

/**
 * 目標条件に一致するOVER POWER譜面エントリを抽出する。
 *
 * @param entries - 未解禁設定を反映済みの全譜面エントリ。
 * @param attributes - 目標の対象条件。
 * @param versions - 公開ID付きのバージョン一覧。
 * @returns 目標条件に一致した譜面エントリ。
 */
const selectGoalOverPowerChartEntries = (
  entries: OverPowerChartEntry[],
  attributes: GoalAttributes,
  versions: VersionDTO[]
): OverPowerChartEntry[] => {
  const diffValues = normalizeGoalAttributeValues(attributes.diff)
  const genreValues = normalizeGoalAttributeValues(attributes.genre)
  const versionIds = normalizeGoalAttributeValues(attributes.ver)
  const nameFolderCodes = normalizeGoalAttributeValues(attributes.name_folder)

  if (
    diffValues?.length === 0 ||
    genreValues?.length === 0 ||
    versionIds?.length === 0 ||
    nameFolderCodes?.length === 0
  ) {
    return []
  }

  const diffNames = diffValues ? normalizeGoalDifficultyNames(diffValues) : undefined
  const genreNames = genreValues ? new Set(genreValues) : undefined

  if (attributes.chart_target === 'OP_TARGET') {
    const entriesBySongId = new Map<string, OverPowerChartEntry[]>()
    for (const entry of entries) {
      const songEntries = entriesBySongId.get(entry.song.id) ?? []
      songEntries.push(entry)
      entriesBySongId.set(entry.song.id, songEntries)
    }

    const matchedEntries: OverPowerChartEntry[] = []
    for (const songEntries of entriesBySongId.values()) {
      const song = songEntries[0]?.song
      if (!song?.op_target_difficulty) continue
      const theoreticalConst = resolveRemainingTheoreticalChartConst(songEntries)
      if (
        !isSongMatchedByGoalAttributes(
          song,
          theoreticalConst,
          attributes,
          genreNames,
          versionIds,
          nameFolderCodes,
          versions
        )
      ) {
        continue
      }
      matchedEntries.push(...songEntries)
    }

    return selectOverPowerChartEntries(matchedEntries, 'OP_TARGET')
  }

  return entries.filter((entry) => {
    if (diffNames && !diffNames.has(entry.difficulty)) return false
    return isSongMatchedByGoalAttributes(
      entry.song,
      entry.chartConst,
      attributes,
      genreNames,
      versionIds,
      nameFolderCodes,
      versions
    )
  })
}

/**
 * 未解禁曲設定を反映したOVER POWER目標の現在値と理論値を算出する。
 *
 * @param input - レコード、楽曲マスタ、対象条件、未解禁設定。
 * @returns 対象譜面数、現在OVER POWER合計、理論OVER POWER合計。
 */
export const calculateGoalOverPowerTotals = (
  input: GoalOverPowerCalculationInput
): GoalOverPowerTotals => {
  const entries = buildOverPowerChartEntries(
    input.songs,
    input.records,
    input.versions,
    input.lockedSongs ?? []
  )
  const selected = selectGoalOverPowerChartEntries(entries, input.attributes, input.versions)

  let current = 0
  let max = 0
  let hasUnknownMaxOp = false
  for (const entry of selected) {
    current += entry.record?.overpower ?? 0
    max += entry.maxOverPower
    if (entry.song.is_maxop_unknown) {
      hasUnknownMaxOp = true
    }
  }

  return { current, max, hasUnknownMaxOp, targetCount: selected.length }
}

/**
 * 対象条件に一致する譜面ごとの最大OVER POWER合計を算出する。
 *
 * @param records - プレイヤーレコード一覧。
 * @param songs - 楽曲マスタ一覧。
 * @param attributes - 目標フォームで選択中の対象条件。
 * @param versions - 公開ID付きのバージョン一覧。
 * @param lockedSongs - 未解禁楽曲設定。
 * @returns 対象譜面それぞれの最大OVER POWERを合計した値。
 */
export const calculateGoalOverPowerChartMax = (
  records: PlayerRecordDTO[],
  songs: SongDTO[],
  attributes: GoalAttributes,
  versions: VersionDTO[] = [],
  lockedSongs: OverPowerLockedSong[] = []
): number =>
  calculateGoalOverPowerTotals({
    records,
    songs,
    versions,
    attributes,
    lockedSongs,
  }).max
