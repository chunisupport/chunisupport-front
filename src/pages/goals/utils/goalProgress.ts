import type {
  GoalAchievementParams,
  GoalAttributes,
  GoalDTO,
  MasterDataDTO,
  PlayerRecordDTO,
  SongDTO,
  VersionDTO,
} from '../../../types/api'
import { resolveGoalVersionValueByReleaseDate } from './goalVersion'

export interface GoalProgressResult {
  current: number
  target: number
  percent: number
  achieved: boolean
  hasUnknownMaxOp: boolean
}

const HARD_LAMP_ORDER: Record<string, number> = {
  HARD: 1,
  BRAVE: 2,
  ABSOLUTE: 3,
  CATASTROPHY: 4,
}

const COMBO_LAMP_ORDER: Record<string, number> = {
  'FULL COMBO': 1,
  'ALL JUSTICE': 2,
}

const normalizeAttributeIds = (value: number | number[] | undefined): number[] => {
  if (typeof value === 'number') return [value]
  if (Array.isArray(value)) {
    return value.filter((id): id is number => Number.isInteger(id))
  }
  return []
}

/**
 * 目標条件に一致するプレイヤーレコードだけを抽出する。
 *
 * @param records - 判定対象のプレイヤーレコード一覧。
 * @param attributes - 目標に設定された対象条件。
 * @param masterData - 難易度・ジャンルなどのマスタデータ。
 * @param songs - 楽曲マスタ一覧。
 * @param versions - version API から返されたバージョン一覧。
 * @returns 目標条件に一致したレコード一覧。
 */
export const filterRecordsByAttributes = (
  records: PlayerRecordDTO[],
  attributes: GoalAttributes,
  masterData: MasterDataDTO,
  songs: SongDTO[],
  versions: VersionDTO[]
): PlayerRecordDTO[] => {
  const songMap = new Map(songs.map((song) => [song.id, song]))
  const diffIds = normalizeAttributeIds(attributes.diff)
  const genreIds = normalizeAttributeIds(attributes.genre)
  const versionIds = normalizeAttributeIds(attributes.ver)

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

  return records.filter((record) => {
    if (diffNames && !diffNames.has(record.difficulty)) return false

    const constMin = attributes.const?.min
    const constMax = attributes.const?.max
    if (typeof constMin === 'number' && record.const < constMin) return false
    if (typeof constMax === 'number' && record.const > constMax) return false

    const song = songMap.get(record.id)
    if (genreNames && (!song?.genre || !genreNames.has(song.genre))) return false

    if (versionIds.length > 0) {
      if (!song) return false
      const songVersionValue = resolveGoalVersionValueByReleaseDate(song.release, versions)
      if (!songVersionValue || !versionIds.includes(songVersionValue)) return false
    }

    return true
  })
}

const getNumberParam = (
  params: GoalAchievementParams,
  key: 'score' | 'count' | 'total'
): number => {
  const value = (params as Record<string, unknown>)[key]
  return typeof value === 'number' ? value : 0
}

/**
 * 対象譜面数を動的上限として扱う件数目標値を解決する。
 *
 * @param params - 目標種別ごとの成果パラメータ。
 * @param filteredRecords - 現在の条件に一致した譜面レコード一覧。
 * @returns 明示された件数、または現在の対象譜面数。
 */
const resolveCountTarget = (
  params: GoalAchievementParams,
  filteredRecords: PlayerRecordDTO[]
): number => {
  const value = (params as Record<string, unknown>).count
  return typeof value === 'number' ? value : filteredRecords.length
}

/**
 * 総スコア目標の動的上限を解決する。
 *
 * @param params - 目標種別ごとの成果パラメータ。
 * @param filteredRecords - 現在の条件に一致した譜面レコード一覧。
 * @returns 明示された総スコア、または対象譜面数に基づく理論値。
 */
const resolveTotalScoreTarget = (
  params: GoalAchievementParams,
  filteredRecords: PlayerRecordDTO[]
): number => {
  const value = (params as Record<string, unknown>).total
  return typeof value === 'number' ? value : filteredRecords.length * 1010000
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
  params: GoalAchievementParams,
  filteredRecords: PlayerRecordDTO[],
  songMap: Map<string, SongDTO>
): number => {
  const value = (params as Record<string, unknown>).total
  if (typeof value === 'number') return value

  return filteredRecords.reduce((acc, record) => acc + (songMap.get(record.id)?.maxop ?? 0), 0)
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
      const threshold = getNumberParam(goal.achievement_params, 'score')
      target = resolveCountTarget(goal.achievement_params, filteredRecords)
      current = filteredRecords.filter((record) => record.score >= threshold).length
      break
    }
    case 'avg_score': {
      target = getNumberParam(goal.achievement_params, 'score')
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
      const hardLampName =
        params.lamp === 'HRD'
          ? 'HARD'
          : params.lamp === 'BRV'
            ? 'BRAVE'
            : params.lamp === 'ABS'
              ? 'ABSOLUTE'
              : 'CATASTROPHY'
      const required = HARD_LAMP_ORDER[hardLampName]
      target = resolveCountTarget(goal.achievement_params, filteredRecords)
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
        params.lamp === 'FC' ? COMBO_LAMP_ORDER['FULL COMBO'] : COMBO_LAMP_ORDER['ALL JUSTICE']
      target = resolveCountTarget(goal.achievement_params, filteredRecords)
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
      target = resolveOverPowerValueTarget(goal.achievement_params, filteredRecords, songMap)
      current = filteredRecords.reduce((acc, record) => acc + record.overpower, 0)
      break
    }
    case 'overpower_percent': {
      target = getNumberParam(goal.achievement_params, 'total')
      const totalOp = filteredRecords.reduce((acc, record) => acc + record.overpower, 0)
      const totalMaxOp = filteredRecords.reduce((acc, record) => {
        const song = songMap.get(record.id)
        if (song?.is_maxop_unknown) {
          hasUnknownMaxOp = true
        }
        return acc + (song?.maxop ?? 0)
      }, 0)
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
