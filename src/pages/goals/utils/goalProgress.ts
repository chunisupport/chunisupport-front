import type {
  GoalAchievementParams,
  GoalAttributes,
  GoalDTO,
  MasterDataDTO,
  PlayerRecordDTO,
  SongDTO,
} from '../../../types/api'
import { resolveVersionNameByReleaseDate } from '../../../utils/versionConverter'

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

const normalizeVersionName = (name: string): string => name.trim().toUpperCase()

const normalizeAttributeIds = (value: number | number[] | undefined): number[] => {
  if (typeof value === 'number') return [value]
  if (Array.isArray(value)) {
    return value.filter((id): id is number => Number.isInteger(id))
  }
  return []
}

const resolveSongVersionId = (song: SongDTO, masterData: MasterDataDTO): number | undefined => {
  const release = song.release
  if (!release) return undefined

  const resolved = resolveVersionNameByReleaseDate(release, masterData.versions)
  const normalized = normalizeVersionName(resolved)
  const byName = masterData.versions.find((v) => normalizeVersionName(v.name) === normalized)
  if (byName) {
    return byName.id
  }

  const sorted = [...masterData.versions].sort((a, b) =>
    a.released_at.localeCompare(b.released_at, 'ja')
  )
  let candidate: number | undefined
  for (const version of sorted) {
    if (release >= version.released_at.slice(0, 10)) {
      candidate = version.id
    }
  }

  return candidate
}

export const filterRecordsByAttributes = (
  records: PlayerRecordDTO[],
  attributes: GoalAttributes,
  masterData: MasterDataDTO,
  songs: SongDTO[]
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
      const songVersionId = resolveSongVersionId(song, masterData)
      if (!songVersionId || !versionIds.includes(songVersionId)) return false
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
      target = getNumberParam(goal.achievement_params, 'count')
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
        count: number
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
      target = params.count
      current = filteredRecords.filter((record) => {
        const lamp = record.clear_lamp
        if (!lamp) return false
        return (HARD_LAMP_ORDER[lamp] ?? 0) >= required
      }).length
      break
    }
    case 'combolamp_count': {
      const params = goal.achievement_params as { lamp: 'FC' | 'AJ'; count: number }
      const required =
        params.lamp === 'FC' ? COMBO_LAMP_ORDER['FULL COMBO'] : COMBO_LAMP_ORDER['ALL JUSTICE']
      target = params.count
      current = filteredRecords.filter((record) => {
        const lamp = record.combo_lamp
        if (!lamp) return false
        return (COMBO_LAMP_ORDER[lamp] ?? 0) >= required
      }).length
      break
    }
    case 'total_score': {
      target = getNumberParam(goal.achievement_params, 'total')
      current = filteredRecords.reduce((acc, record) => acc + record.score, 0)
      break
    }
    case 'overpower_value': {
      target = getNumberParam(goal.achievement_params, 'total')
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
