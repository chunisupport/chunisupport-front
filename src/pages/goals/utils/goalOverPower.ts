import { normalizePlayerDataDifficulty } from '../../../constants/difficulty'
import type {
  GoalAttributes,
  MasterDataDTO,
  PlayerRecordDTO,
  SongDTO,
  VersionDTO,
} from '../../../types/api'
import {
  buildOverPowerChartEntries,
  selectOverPowerChartEntries,
} from '../../../usecases/overpower/aggregation'
import type { OverPowerChartEntry, OverPowerLockedSong } from '../../../usecases/overpower/types'
import { normalizeGoalAttributeIds } from '../../../utils/goalAttributes'
import { resolveGoalVersionValueByReleaseDate } from '../../../utils/goalVersion'

const OVERPOWER_CHART_CONST_BONUS = 3
const OVERPOWER_CHART_MULTIPLIER = 5

const EMPTY_MASTER_DATA: MasterDataDTO = {
  genres: [],
  difficulties: [],
  versions: [],
  account_types: [],
  rating_bands: [],
  achievement_types: [],
  possessions: [],
}

/** OVER POWER目標の現在値と理論値 */
export interface GoalOverPowerTotals {
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
  /** バージョン一覧 */
  versions: VersionDTO[]
  /** 難易度・ジャンルなどのマスタデータ */
  masterData: MasterDataDTO
  /** 目標の対象条件 */
  attributes: GoalAttributes
  /** 未解禁楽曲設定。未指定なら除外しない */
  lockedSongs?: OverPowerLockedSong[]
}

/**
 * 譜面定数から譜面別の理論OVER POWERを算出する。
 *
 * @param chartConst - 対象譜面の譜面定数。
 * @returns 譜面別の理論OVER POWER。
 */
export const calculateGoalChartMaxOverPower = (chartConst: number): number =>
  (chartConst + OVERPOWER_CHART_CONST_BONUS) * OVERPOWER_CHART_MULTIPLIER

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
 * 目標属性のジャンル・バージョン・定数が楽曲に一致するか判定する。
 *
 * @param song - 判定対象の楽曲。
 * @param chartConst - 条件比較に使う譜面定数。
 * @param attributes - 目標の対象条件。
 * @param genreNames - 対象ジャンル名。
 * @param versionIds - 対象バージョン番号。
 * @param versions - バージョン一覧。
 * @returns 条件に一致する場合はtrue。
 */
const isSongMatchedByGoalAttributes = (
  song: SongDTO,
  chartConst: number,
  attributes: GoalAttributes,
  genreNames: Set<string> | undefined,
  versionIds: number[] | undefined,
  versions: VersionDTO[]
): boolean => {
  const constMin = attributes.const?.min
  const constMax = attributes.const?.max
  if (typeof constMin === 'number' && chartConst < constMin) return false
  if (typeof constMax === 'number' && chartConst > constMax) return false
  if (genreNames && (!song.genre || !genreNames.has(song.genre))) return false
  if (versionIds && versionIds.length > 0) {
    const songVersionValue = resolveGoalVersionValueByReleaseDate(song.release, versions)
    if (!songVersionValue || !versionIds.includes(songVersionValue)) return false
  }
  return true
}

/**
 * 目標条件に一致するOVER POWER譜面エントリを抽出する。
 *
 * @param entries - 未解禁設定を反映済みの全譜面エントリ。
 * @param attributes - 目標の対象条件。
 * @param masterData - 難易度・ジャンルなどのマスタデータ。
 * @param versions - バージョン一覧。
 * @returns 目標条件に一致した譜面エントリ。
 */
const selectGoalOverPowerChartEntries = (
  entries: OverPowerChartEntry[],
  attributes: GoalAttributes,
  masterData: MasterDataDTO,
  versions: VersionDTO[]
): OverPowerChartEntry[] => {
  const diffIds = normalizeGoalAttributeIds(attributes.diff)
  const genreIds = normalizeGoalAttributeIds(attributes.genre)
  const versionIds = normalizeGoalAttributeIds(attributes.ver)

  if (diffIds?.length === 0 || genreIds?.length === 0 || versionIds?.length === 0) {
    return []
  }

  const diffNames =
    diffIds && diffIds.length > 0
      ? new Set(
          masterData.difficulties
            .filter((difficulty) => diffIds.includes(difficulty.id))
            .flatMap((difficulty) => {
              const normalized = normalizePlayerDataDifficulty(difficulty.name)
              return normalized ? [normalized] : []
            })
        )
      : undefined
  const genreNames =
    genreIds && genreIds.length > 0
      ? new Set(
          masterData.genres
            .filter((genre) => genreIds.includes(genre.id))
            .map((genre) => genre.name)
        )
      : undefined

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
      versions
    )
  })
}

/**
 * 未解禁曲設定を反映したOVER POWER目標の現在値と理論値を算出する。
 *
 * @param input - レコード、楽曲マスタ、対象条件、未解禁設定。
 * @returns 対象譜面の現在OVER POWER合計と理論OVER POWER合計。
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
  const selected = selectGoalOverPowerChartEntries(
    entries,
    input.attributes,
    input.masterData,
    input.versions
  )

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

  return { current, max, hasUnknownMaxOp }
}

/**
 * 対象条件に一致する譜面ごとの最大OVER POWER合計を算出する。
 *
 * @param records - プレイヤーレコード一覧。
 * @param songs - 楽曲マスタ一覧。
 * @param attributes - 目標フォームで選択中の対象条件。
 * @param versions - バージョン一覧。
 * @param masterData - 難易度・ジャンルなどのマスタデータ。
 * @param lockedSongs - 未解禁楽曲設定。
 * @returns 対象譜面それぞれの最大OVER POWERを合計した値。
 */
export const calculateGoalOverPowerChartMax = (
  records: PlayerRecordDTO[],
  songs: SongDTO[],
  attributes: GoalAttributes,
  versions: VersionDTO[] = [],
  masterData: MasterDataDTO = EMPTY_MASTER_DATA,
  lockedSongs: OverPowerLockedSong[] = []
): number =>
  calculateGoalOverPowerTotals({
    records,
    songs,
    versions,
    masterData,
    attributes,
    lockedSongs,
  }).max
