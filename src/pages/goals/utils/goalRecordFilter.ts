import { CHART_CONST_MAX, CHART_CONST_MIN, SCORE_MIN } from '../../../constants/chart'
import type { GoalDTO, MasterDataDTO, VersionDTO } from '../../../types/api'
import type { Difficulty, FilterState } from '../../../types/recordFilter'
import { buildDefaultFilter } from '../../../utils/recordFilterDefaults'
import { MAX_SCORE } from '../../../utils/scoreRank'
import { normalizeGoalAttributeIds } from './goalAttributes'
import {
  COMBO_LAMP_UNACHIEVED_FILTERS,
  HARD_LAMP_UNACHIEVED_FILTERS,
  isComboLampGoalValue,
  isHardLampGoalValue,
} from './goalLamp'
import { buildGoalVersionNameMap } from './goalVersion'

const NAVIGABLE_ACHIEVEMENT_TYPES = new Set<GoalDTO['achievement_type']>([
  'rank_count',
  'score_count',
  'avg_score',
  'hardlamp_count',
  'combolamp_count',
])

/**
 * 属性ID配列が空選択として保存されているか判定する。
 *
 * @param ids - 正規化済みの属性ID配列。
 * @returns 空配列なら true。
 */
const hasNoSelectedAttributeIds = (ids: number[] | undefined): boolean => ids?.length === 0

/**
 * API由来の成果パラメータからランプ指定値を安全に取り出す。
 *
 * @param goal - ランプ指定を持つ可能性がある目標。
 * @returns ランプ指定値。オブジェクト形式でない場合は undefined。
 */
const getGoalLampParam = (goal: GoalDTO): unknown => {
  const params: unknown = goal.achievement_params
  return params && typeof params === 'object' && 'lamp' in params
    ? (params as { lamp?: unknown }).lamp
    : undefined
}

/**
 * 通常レコード遷移に使えるハードランプ目標か判定する。
 *
 * @param goal - 判定対象の目標。
 * @returns ランプ指定が現行定義に含まれる場合は true。
 */
const isNavigableHardLampGoal = (goal: GoalDTO): boolean => {
  const lamp = getGoalLampParam(goal)
  return typeof lamp === 'string' && isHardLampGoalValue(lamp)
}

/**
 * 通常レコード遷移に使えるコンボランプ目標か判定する。
 *
 * @param goal - 判定対象の目標。
 * @returns ランプ指定が現行定義に含まれる場合は true。
 */
const isNavigableComboLampGoal = (goal: GoalDTO): boolean => {
  const lamp = getGoalLampParam(goal)
  return typeof lamp === 'string' && isComboLampGoalValue(lamp)
}

/**
 * 目標種別ごとの未達成条件を通常レコードフィルターへ反映する。
 *
 * @param filter - 属性条件を反映済みのフィルター。
 * @param goal - 未達成条件の変換元となる目標。
 * @returns 未達成条件を反映したフィルター。
 */
const applyUnachievedCondition = (filter: FilterState, goal: GoalDTO): FilterState => {
  switch (goal.achievement_type) {
    case 'rank_count':
    case 'score_count':
    case 'avg_score': {
      const params = goal.achievement_params as { score: number }
      return {
        ...filter,
        score: { min: SCORE_MIN, max: Math.max(SCORE_MIN, params.score - 1) },
      }
    }
    case 'hardlamp_count': {
      const lamp = getGoalLampParam(goal)
      if (typeof lamp !== 'string' || !isHardLampGoalValue(lamp)) {
        return filter
      }
      return { ...filter, hard_lamp: [...HARD_LAMP_UNACHIEVED_FILTERS[lamp]] }
    }
    case 'combolamp_count': {
      const lamp = getGoalLampParam(goal)
      if (typeof lamp !== 'string' || !isComboLampGoalValue(lamp)) {
        return filter
      }
      return { ...filter, combo_lamp: [...COMBO_LAMP_UNACHIEVED_FILTERS[lamp]] }
    }
    case 'total_score':
    case 'overpower_value':
    case 'overpower_percent':
      return filter
  }
}

/**
 * 目標から通常レコード画面で未達成譜面を表示するフィルターを作る。
 *
 * @param goal - 変換元となる目標。
 * @param masterData - 難易度とジャンルを解決するマスタデータ。
 * @param versions - 目標用バージョン番号を表示名へ変換するバージョン一覧。
 * @returns 目標属性と未達成条件を反映した通常レコードフィルター。
 */
export const buildGoalRecordFilter = (
  goal: GoalDTO,
  masterData: MasterDataDTO,
  versions: VersionDTO[]
): FilterState => {
  const difficultyIds = normalizeGoalAttributeIds(goal.attributes.diff)
  const genreIds = normalizeGoalAttributeIds(goal.attributes.genre)
  const versionIds = normalizeGoalAttributeIds(goal.attributes.ver)
  const versionNameMap = buildGoalVersionNameMap(versions)
  const defaultFilter = buildDefaultFilter(masterData, versions)
  const hasNoSelectedCharts =
    hasNoSelectedAttributeIds(difficultyIds) ||
    hasNoSelectedAttributeIds(genreIds) ||
    hasNoSelectedAttributeIds(versionIds)

  const filter: FilterState = {
    ...defaultFilter,
    title: '',
    difficulties: hasNoSelectedCharts
      ? []
      : masterData.difficulties
          .filter((difficulty) => !difficultyIds || difficultyIds.includes(difficulty.id))
          .map((difficulty) => difficulty.name.toUpperCase() as Difficulty),
    genres:
      hasNoSelectedCharts || !genreIds
        ? []
        : masterData.genres
            .filter((genre) => genreIds.includes(genre.id))
            .map((genre) => genre.name),
    versions:
      hasNoSelectedCharts || !versionIds
        ? []
        : versionIds.flatMap((versionId) => {
            const versionName = versionNameMap.get(versionId)
            return versionName ? [versionName] : []
          }),
    const: {
      min: goal.attributes.const?.min ?? CHART_CONST_MIN,
      max: goal.attributes.const?.max ?? CHART_CONST_MAX,
    },
    constFilterMode: 'number',
    score: { min: SCORE_MIN, max: MAX_SCORE },
    scoreFilterMode: 'number',
    excludeNoPlay: false,
  }

  return applyUnachievedCondition(filter, goal)
}

/**
 * 目標を曲単位の未達成フィルターへ変換できるか判定する。
 *
 * @param goal - 判定対象の目標。
 * @returns 通常レコードへのフィルター付き遷移が可能な場合は true。
 */
export const isGoalRecordNavigationEnabled = (goal: GoalDTO): boolean =>
  goal.attributes.chart_target !== 'OP_TARGET' &&
  !hasNoSelectedAttributeIds(normalizeGoalAttributeIds(goal.attributes.diff)) &&
  !hasNoSelectedAttributeIds(normalizeGoalAttributeIds(goal.attributes.genre)) &&
  !hasNoSelectedAttributeIds(normalizeGoalAttributeIds(goal.attributes.ver)) &&
  NAVIGABLE_ACHIEVEMENT_TYPES.has(goal.achievement_type) &&
  (goal.achievement_type !== 'hardlamp_count' || isNavigableHardLampGoal(goal)) &&
  (goal.achievement_type !== 'combolamp_count' || isNavigableComboLampGoal(goal))
