import type { GoalFilterOptions } from '../api/songs'
import { normalizePlayerDataDifficulty } from '../constants/difficulty'
import type { GoalDTO, PlayerDataDifficulty, PlayerRecordDTO, VersionDTO } from '../types/api'
import { normalizeGoalAttributeIds } from './goalAttributes'
import {
  COMBO_LAMP_UNACHIEVED_FILTERS,
  FULL_CHAIN_UNACHIEVED_FILTERS,
  HARD_LAMP_UNACHIEVED_FILTERS,
  isComboLampGoalValue,
  isFullChainGoalValue,
  isHardLampGoalValue,
} from './goalLamp'
import { hasRainbowRequiredCharts } from './goalRainbowCharts'
import { resolveRatingGoalMinimumChartConstant } from './goalRatingCount'
import { buildGoalVersionNameMap } from './goalVersion'
import {
  createRandomSongCandidateKey,
  isRandomSongOpTargetCandidate,
  type RandomSongCandidate,
} from './randomSongSelector'

const RANDOM_SONG_GOAL_FILTER_TYPES = new Set<GoalDTO['achievement_type']>([
  'rank_count',
  'score_count',
  'avg_score',
  'hardlamp_count',
  'combolamp_count',
  'rainbow_count',
  'rating_count',
  'fullchain_count',
])

/**
 * API由来の目標パラメータからランプ指定値を安全に取得する。
 *
 * @param goal - ランプ指定を持つ可能性がある目標。
 * @returns ランプ指定値。取得できない場合は undefined。
 */
const getRandomSongGoalLampParam = (goal: GoalDTO): unknown => {
  const params: unknown = goal.achievement_params
  return params && typeof params === 'object' && 'lamp' in params
    ? (params as { lamp?: unknown }).lamp
    : undefined
}

/**
 * 保存済み目標をランダム選曲の未達成譜面フィルターとして利用できるか判定する。
 *
 * @param goal - 判定対象の保存済み目標。
 * @returns 譜面単位の未達成判定が可能な目標なら true。
 */
export const isRandomSongGoalFilterAvailable = (goal: GoalDTO): boolean => {
  if (!RANDOM_SONG_GOAL_FILTER_TYPES.has(goal.achievement_type)) return false

  if (['rank_count', 'score_count', 'avg_score'].includes(goal.achievement_type)) {
    const params = goal.achievement_params as { score?: unknown }
    return typeof params?.score === 'number' && Number.isFinite(params.score)
  }

  if (goal.achievement_type === 'rating_count') {
    const params = goal.achievement_params as { rating?: unknown }
    return typeof params?.rating === 'number' && Number.isFinite(params.rating)
  }
  const lamp = getRandomSongGoalLampParam(goal)
  if (goal.achievement_type === 'fullchain_count') {
    return typeof lamp === 'string' && isFullChainGoalValue(lamp)
  }
  if (goal.achievement_type === 'hardlamp_count') {
    return typeof lamp === 'string' && isHardLampGoalValue(lamp)
  }
  if (goal.achievement_type === 'combolamp_count') {
    return typeof lamp === 'string' && isComboLampGoalValue(lamp)
  }

  return true
}

type ResolvedRandomSongGoalAttributes = {
  hasNoSelectedCharts: boolean
  opTargetOnly: boolean
  difficulties?: ReadonlySet<PlayerDataDifficulty>
  genres?: ReadonlySet<string>
  versions?: ReadonlySet<string>
  constMin?: number
  constMax?: number
}

/**
 * 保存済み目標の属性IDをランダム選曲候補と比較できる条件へ一度だけ解決する。
 *
 * @param goal - 適用する保存済み目標。
 * @param masterData - 目標属性IDを表示値へ解決するマスタデータ。
 * @param versions - 目標のバージョン番号を解決するバージョン一覧。
 * @returns 候補の各項目と直接比較できる目標条件。
 */
const resolveRandomSongGoalAttributes = (
  goal: GoalDTO,
  masterData: GoalFilterOptions,
  versions: readonly VersionDTO[]
): ResolvedRandomSongGoalAttributes => {
  const isRainbowGoal = goal.achievement_type === 'rainbow_count'
  const difficultyIds = isRainbowGoal ? undefined : normalizeGoalAttributeIds(goal.attributes.diff)
  const genreIds = normalizeGoalAttributeIds(goal.attributes.genre)
  const versionIds = normalizeGoalAttributeIds(goal.attributes.ver)
  const versionNameMap = buildGoalVersionNameMap(versions)

  return {
    hasNoSelectedCharts:
      difficultyIds?.length === 0 || genreIds?.length === 0 || versionIds?.length === 0,
    opTargetOnly: !isRainbowGoal && goal.attributes.chart_target === 'OP_TARGET',
    difficulties: difficultyIds
      ? new Set(
          masterData.difficulties
            .filter((difficulty) => difficultyIds.includes(difficulty.id))
            .flatMap((difficulty) => {
              const normalized = normalizePlayerDataDifficulty(difficulty.name)
              return normalized ? [normalized] : []
            })
        )
      : undefined,
    genres: genreIds
      ? new Set(
          masterData.genres
            .filter((genre) => genreIds.includes(genre.id))
            .map((genre) => genre.name)
        )
      : undefined,
    versions: versionIds
      ? new Set(versionIds.flatMap((id) => versionNameMap.get(id) ?? []))
      : undefined,
    constMin: isRainbowGoal ? undefined : goal.attributes.const?.min,
    constMax: isRainbowGoal ? undefined : goal.attributes.const?.max,
  }
}

/**
 * ランダム選曲候補が解決済みの目標属性に一致するか判定する。
 *
 * @param candidate - 判定対象の選曲候補。
 * @param attributes - 表示値へ解決済みの目標属性。
 * @returns 目標の対象譜面なら true。
 */
const isRandomSongCandidateMatchedByGoalAttributes = (
  candidate: RandomSongCandidate,
  attributes: ResolvedRandomSongGoalAttributes
): boolean => {
  if (attributes.hasNoSelectedCharts) return false

  if (attributes.opTargetOnly) {
    if (!isRandomSongOpTargetCandidate(candidate)) return false
  } else if (attributes.difficulties && !attributes.difficulties.has(candidate.difficulty)) {
    return false
  }

  if (typeof attributes.constMin === 'number' && candidate.chartConst < attributes.constMin)
    return false
  if (typeof attributes.constMax === 'number' && candidate.chartConst > attributes.constMax)
    return false
  if (attributes.genres && !attributes.genres.has(candidate.genre)) return false
  if (attributes.versions && !attributes.versions.has(candidate.version)) return false

  return true
}

/**
 * ランダム選曲候補が目標の成果条件をまだ達成していないか判定する。
 *
 * @param record - 候補譜面に対応するユーザーレコード。
 * @param goal - 適用する保存済み目標。
 * @returns 未達成譜面なら true。
 */
const isRandomSongRecordUnachievedForGoal = (
  record: PlayerRecordDTO | undefined,
  goal: GoalDTO
): boolean => {
  switch (goal.achievement_type) {
    case 'rank_count':
    case 'score_count':
    case 'avg_score': {
      const params = goal.achievement_params as { score: number }
      const score = record?.is_played === true ? record.score : 0
      return score < params.score
    }
    case 'rating_count': {
      const params = goal.achievement_params as { rating: number }
      return (record?.is_played === true ? record.rating : 0) < params.rating
    }
    case 'hardlamp_count': {
      const lamp = getRandomSongGoalLampParam(goal)
      return (
        typeof lamp === 'string' &&
        isHardLampGoalValue(lamp) &&
        HARD_LAMP_UNACHIEVED_FILTERS[lamp].includes(record?.is_played ? record.clear_lamp : null)
      )
    }
    case 'combolamp_count': {
      const lamp = getRandomSongGoalLampParam(goal)
      return (
        typeof lamp === 'string' &&
        isComboLampGoalValue(lamp) &&
        COMBO_LAMP_UNACHIEVED_FILTERS[lamp].includes(record?.is_played ? record.combo_lamp : null)
      )
    }
    case 'fullchain_count': {
      const lamp = getRandomSongGoalLampParam(goal)
      return (
        typeof lamp === 'string' &&
        isFullChainGoalValue(lamp) &&
        FULL_CHAIN_UNACHIEVED_FILTERS[lamp].includes(record?.is_played ? record.full_chain : null)
      )
    }
    case 'rainbow_count':
      return record?.is_played !== true || record.combo_lamp !== 'ALL JUSTICE'
    case 'total_score':
    case 'overpower_value':
    case 'overpower_percent':
      return false
  }
}

/**
 * 保存済み目標の対象条件と未達成条件でランダム選曲候補を絞り込む。
 *
 * @param candidates - 譜面単位の選曲候補。
 * @param recordsByChartKey - 譜面単位キーで参照できるユーザーレコード。
 * @param goal - 適用する保存済み目標。
 * @param masterData - 目標属性IDを解決するマスタデータ。
 * @param versions - 目標バージョン番号を解決するバージョン一覧。
 * @returns 目標の対象に含まれる未達成譜面候補。
 */
export const filterRandomSongCandidatesByGoal = (
  candidates: readonly RandomSongCandidate[],
  recordsByChartKey: ReadonlyMap<string, PlayerRecordDTO>,
  goal: GoalDTO,
  masterData: GoalFilterOptions,
  versions: readonly VersionDTO[]
): RandomSongCandidate[] => {
  if (!isRandomSongGoalFilterAvailable(goal)) return []
  const attributes = resolveRandomSongGoalAttributes(goal, masterData, versions)

  return candidates.filter((candidate) => {
    if (goal.achievement_type === 'rainbow_count' && !hasRainbowRequiredCharts(candidate.song))
      return false
    if (!isRandomSongCandidateMatchedByGoalAttributes(candidate, attributes)) {
      return false
    }

    if (goal.achievement_type === 'rating_count' && 'rating' in goal.achievement_params) {
      if (
        candidate.song.charts[candidate.difficulty]?.is_const_unknown ||
        candidate.chartConst < resolveRatingGoalMinimumChartConstant(goal.achievement_params.rating)
      )
        return false
    }
    const record = recordsByChartKey.get(createRandomSongCandidateKey(candidate))
    return isRandomSongRecordUnachievedForGoal(record, goal)
  })
}
