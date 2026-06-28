import type {
  GoalAttributes,
  GoalDTO,
  MasterDataDTO,
  PlayerRecordDTO,
  SongDTO,
  VersionDTO,
} from '../../../types/api'
import { buildCurrentOverPowerBySongId } from '../../../usecases/overpower/currentOpTarget'
import { MAX_SCORE } from '../../../utils/scoreRank'
import { isExplicitEmptyGoalAttribute, normalizeGoalAttributeIds } from './goalAttributes'
import { getNumberGoalTargetParam, resolveGoalDynamicTarget } from './goalCountTarget'
import { COMBO_LAMP_ORDER, HARD_LAMP_ORDER, resolveHardLampRecordName } from './goalLamp'
import { resolveGoalVersionValueByReleaseDate } from './goalVersion'

export interface GoalProgressResult {
  current: number
  target: number
  percent: number
  achieved: boolean
  hasUnknownMaxOp: boolean
}

interface FilterRecordsByAttributesOptions {
  /** OP対象指定時に、対象曲の全譜面レコードを残すか。OVER POWER集計で曲内最大値を取るために使う。 */
  includeAllChartsForOpTarget?: boolean
}

/**
 * レコードが曲ごとのOVER POWER対象譜面かを判定する。
 *
 * @param record - 判定対象のプレイヤーレコード。
 * @param song - レコードに対応する楽曲マスタ。
 * @returns 楽曲のOP対象難易度とレコード難易度が一致する場合はtrue。
 */
const isOverPowerTargetRecord = (record: PlayerRecordDTO, song: SongDTO | undefined): boolean =>
  song?.op_target_difficulty === record.difficulty

/**
 * 楽曲マスタからOP対象譜面の定数を取得する。
 *
 * @param song - 判定対象の楽曲マスタ。
 * @returns OP対象譜面の定数。対象譜面が解決できない場合はundefined。
 */
const getOverPowerTargetChartConst = (song: SongDTO): number | undefined => {
  const targetDifficulty = song.op_target_difficulty
  if (!targetDifficulty) return undefined
  return song.charts[targetDifficulty]?.const
}

/**
 * OP対象曲が目標属性に一致するか判定する。
 *
 * @param song - 判定対象の楽曲マスタ。
 * @param attributes - 目標に設定された対象条件。
 * @param genreNames - ジャンルIDから解決した対象ジャンル名。
 * @param versionIds - 対象バージョン番号。
 * @param versions - version API から返されたバージョン一覧。
 * @returns OP対象譜面の定数、曲ジャンル、曲バージョンが条件に一致する場合はtrue。
 */
const isOverPowerTargetSongMatched = (
  song: SongDTO | undefined,
  attributes: GoalAttributes,
  genreNames: Set<string> | undefined,
  versionIds: number[],
  versions: VersionDTO[]
): song is SongDTO => {
  if (!song?.op_target_difficulty) return false

  const targetConst = getOverPowerTargetChartConst(song)
  const constMin = attributes.const?.min
  const constMax = attributes.const?.max
  if (typeof targetConst !== 'number') return false
  if (typeof constMin === 'number' && targetConst < constMin) return false
  if (typeof constMax === 'number' && targetConst > constMax) return false

  if (genreNames && (!song.genre || !genreNames.has(song.genre))) return false

  if (versionIds.length > 0) {
    const songVersionValue = resolveGoalVersionValueByReleaseDate(song.release, versions)
    if (!songVersionValue || !versionIds.includes(songVersionValue)) return false
  }

  return true
}

/**
 * 目標条件に一致するプレイヤーレコードだけを抽出する。
 *
 * @param records - 判定対象のプレイヤーレコード一覧。
 * @param attributes - 目標に設定された対象条件。
 * @param masterData - 難易度・ジャンルなどのマスタデータ。
 * @param songs - 楽曲マスタ一覧。
 * @param versions - version API から返されたバージョン一覧。
 * @param options - OP対象のレコード粒度を調整する追加オプション。
 * @returns 目標条件に一致したレコード一覧。
 */
export const filterRecordsByAttributes = (
  records: PlayerRecordDTO[],
  attributes: GoalAttributes,
  masterData: MasterDataDTO,
  songs: SongDTO[],
  versions: VersionDTO[],
  options: FilterRecordsByAttributesOptions = {}
): PlayerRecordDTO[] => {
  const songMap = new Map(songs.map((song) => [song.id, song]))
  const diffIds = normalizeGoalAttributeIds(attributes.diff)
  const genreIds = normalizeGoalAttributeIds(attributes.genre)
  const versionIds = normalizeGoalAttributeIds(attributes.ver)
  const opTargetOnly = attributes.chart_target === 'OP_TARGET'
  const hasExplicitEmptyDiff = !opTargetOnly && isExplicitEmptyGoalAttribute(attributes.diff)
  const hasExplicitEmptyGenre = isExplicitEmptyGoalAttribute(attributes.genre)
  const hasExplicitEmptyVersion = isExplicitEmptyGoalAttribute(attributes.ver)

  const diffNames =
    diffIds.length > 0
      ? new Set(
          masterData.difficulties
            .filter((difficulty) => diffIds.includes(difficulty.id))
            .map((difficulty) => difficulty.name)
        )
      : undefined
  const genreNames =
    genreIds.length > 0
      ? new Set(
          masterData.genres
            .filter((genre) => genreIds.includes(genre.id))
            .map((genre) => genre.name)
        )
      : undefined

  if (hasExplicitEmptyDiff || hasExplicitEmptyGenre || hasExplicitEmptyVersion) {
    return []
  }

  return records.filter((record) => {
    const song = songMap.get(record.id)

    if (opTargetOnly) {
      if (!isOverPowerTargetSongMatched(song, attributes, genreNames, versionIds, versions)) {
        return false
      }
      return options.includeAllChartsForOpTarget || isOverPowerTargetRecord(record, song)
    }
    if (diffNames && !diffNames.has(record.difficulty)) return false

    const constMin = attributes.const?.min
    const constMax = attributes.const?.max
    if (typeof constMin === 'number' && record.const < constMin) return false
    if (typeof constMax === 'number' && record.const > constMax) return false

    if (genreNames && (!song?.genre || !genreNames.has(song.genre))) return false

    if (versionIds.length > 0) {
      if (!song) return false
      const songVersionValue = resolveGoalVersionValueByReleaseDate(song.release, versions)
      if (!songVersionValue || !versionIds.includes(songVersionValue)) return false
    }

    return true
  })
}

/**
 * 総スコア目標の動的上限を解決する。
 *
 * @param params - 目標種別ごとの成果パラメータ。
 * @param filteredRecords - 現在の条件に一致した譜面レコード一覧。
 * @returns 明示された総スコア、または対象譜面数に基づく理論値。
 */
const resolveTotalScoreTarget = (
  params: GoalDTO['achievement_params'],
  filteredRecords: PlayerRecordDTO[]
): number => {
  return resolveGoalDynamicTarget(params, filteredRecords.length * MAX_SCORE, 'total')
}

/**
 * OVER POWER合計目標の動的上限を解決する。
 *
 * @param params - 目標種別ごとの成果パラメータ。
 * @param filteredRecords - 現在の条件に一致した譜面レコード一覧。
 * @param songMap - 楽曲IDから楽曲情報を引くためのマップ。
 * @returns 明示されたOVER POWER合計、または対象譜面の理論値合計。
 */
const resolveOverPowerValueTarget = (
  params: GoalDTO['achievement_params'],
  filteredRecords: PlayerRecordDTO[],
  songMap: Map<string, SongDTO>,
  useSongMaxOverPower: boolean
): number => {
  let maxValue: number
  if (useSongMaxOverPower) {
    maxValue = sumUniqueSongMaxOverPower(filteredRecords, songMap)
  } else {
    maxValue = filteredRecords.reduce(
      (acc, record) => acc + (songMap.get(record.id)?.maxop ?? 0),
      0
    )
  }
  return resolveGoalDynamicTarget(params, maxValue, 'total')
}

/**
 * 曲ごとの理論OVER POWERを重複なく合計する。
 *
 * @param records - 集計対象曲を含むプレイヤーレコード一覧。
 * @param songMap - 楽曲IDから楽曲情報を引くためのマップ。
 * @returns 曲ごとの最大OVER POWER合計。
 */
const sumUniqueSongMaxOverPower = (
  records: PlayerRecordDTO[],
  songMap: Map<string, SongDTO>
): number => {
  const songIds = new Set(records.map((record) => record.id))
  let total = 0
  for (const songId of songIds) {
    total += songMap.get(songId)?.maxop ?? 0
  }
  return total
}

/**
 * 曲ごとの現在OVER POWER対象レコードを合計する。
 *
 * @param records - 集計対象のプレイヤーレコード一覧。
 * @returns 同一曲内では現在OP対象レコードのOVER POWERを1回だけ採用した合計値。
 */
const sumCurrentOpTargetOverPowerBySong = (records: PlayerRecordDTO[]): number => {
  const targetOverPowerBySong = buildCurrentOverPowerBySongId(records)
  return [...targetOverPowerBySong.values()].reduce((acc, overpower) => acc + overpower, 0)
}

/**
 * 目標の現在値、目標値、達成率を計算する。
 *
 * @param goal - 計算対象の目標。
 * @param filteredRecords - 目標条件に一致したプレイヤーレコード一覧。
 * @param songs - 楽曲マスタ一覧。
 * @returns 目標カード表示に必要な進捗情報。
 */
export const calculateGoalProgress = (
  goal: GoalDTO,
  filteredRecords: PlayerRecordDTO[],
  songs: SongDTO[]
): GoalProgressResult => {
  const songMap = new Map(songs.map((song) => [song.id, song]))

  let current = 0
  let target = 1
  let hasUnknownMaxOp = false

  switch (goal.achievement_type) {
    case 'rank_count':
    case 'score_count': {
      const threshold = getNumberGoalTargetParam(goal.achievement_params, 'score')
      target = resolveGoalDynamicTarget(goal.achievement_params, filteredRecords.length, 'count')
      current = filteredRecords.filter((record) => record.score >= threshold).length
      break
    }
    case 'avg_score': {
      target = getNumberGoalTargetParam(goal.achievement_params, 'score')
      if (filteredRecords.length === 0) {
        current = 0
      } else {
        const sum = filteredRecords.reduce((acc, record) => acc + record.score, 0)
        current = Math.floor(sum / filteredRecords.length)
      }
      break
    }
    case 'hardlamp_count': {
      const params = goal.achievement_params as {
        lamp: 'HRD' | 'BRV' | 'ABS' | 'CTS'
        count?: number
      }
      const hardLampName = resolveHardLampRecordName(params.lamp)
      const required = HARD_LAMP_ORDER[hardLampName] ?? 0
      target = resolveGoalDynamicTarget(goal.achievement_params, filteredRecords.length, 'count')
      current = filteredRecords.filter((record) => {
        const lamp = record.clear_lamp
        if (!lamp) return false
        return (HARD_LAMP_ORDER[lamp] ?? 0) >= required
      }).length
      break
    }
    case 'combolamp_count': {
      const params = goal.achievement_params as { lamp: 'FC' | 'AJ'; count?: number }
      const required =
        (params.lamp === 'FC' ? COMBO_LAMP_ORDER['FULL COMBO'] : COMBO_LAMP_ORDER['ALL JUSTICE']) ??
        0
      target = resolveGoalDynamicTarget(goal.achievement_params, filteredRecords.length, 'count')
      current = filteredRecords.filter((record) => {
        const lamp = record.combo_lamp
        if (!lamp) return false
        return (COMBO_LAMP_ORDER[lamp] ?? 0) >= required
      }).length
      break
    }
    case 'total_score': {
      target = resolveTotalScoreTarget(goal.achievement_params, filteredRecords)
      current = filteredRecords.reduce((acc, record) => acc + record.score, 0)
      break
    }
    case 'overpower_value': {
      const useSongAggregation = goal.attributes.chart_target === 'OP_TARGET'
      target = resolveOverPowerValueTarget(
        goal.achievement_params,
        filteredRecords,
        songMap,
        useSongAggregation
      )
      current = useSongAggregation
        ? sumCurrentOpTargetOverPowerBySong(filteredRecords)
        : filteredRecords.reduce((acc, record) => acc + record.overpower, 0)
      break
    }
    case 'overpower_percent': {
      target = getNumberGoalTargetParam(goal.achievement_params, 'total')
      const useSongAggregation = goal.attributes.chart_target === 'OP_TARGET'
      const totalOp = useSongAggregation
        ? sumCurrentOpTargetOverPowerBySong(filteredRecords)
        : filteredRecords.reduce((acc, record) => acc + record.overpower, 0)
      const targetSongIds = useSongAggregation
        ? new Set(filteredRecords.map((record) => record.id))
        : undefined
      const totalMaxOp = useSongAggregation
        ? sumUniqueSongMaxOverPower(filteredRecords, songMap)
        : filteredRecords.reduce((acc, record) => {
            const song = songMap.get(record.id)
            if (song?.is_maxop_unknown) {
              hasUnknownMaxOp = true
            }
            return acc + (song?.maxop ?? 0)
          }, 0)
      if (targetSongIds) {
        for (const songId of targetSongIds) {
          const song = songMap.get(songId)
          if (song?.is_maxop_unknown) {
            hasUnknownMaxOp = true
          }
        }
      }
      current = totalMaxOp > 0 ? (totalOp / totalMaxOp) * 100 : 0
      break
    }
  }

  const safeTarget = target <= 0 ? 1 : target
  const rawPercent = (current / safeTarget) * 100
  const percent = Number.isFinite(rawPercent) ? Math.max(0, Math.min(rawPercent, 100)) : 0

  return {
    current,
    target,
    percent,
    achieved: current >= target,
    hasUnknownMaxOp,
  }
}
