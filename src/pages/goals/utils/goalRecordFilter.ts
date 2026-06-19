import type { GoalDTO, MasterDataDTO, VersionDTO } from '../../../types/api'
import { MAX_SCORE } from '../../../utils/scoreRank'
import { CONST_MAX, CONST_MIN } from '../../users/UserRecord/constants/constRange'
import { buildDefaultFilter } from '../../users/UserRecord/types/filterDefaults'
import type {
  ComboLamp,
  Difficulty,
  FilterState,
  HardLamp,
} from '../../users/UserRecord/types/types'
import { buildGoalVersionNameMap } from './goalVersion'

const NAVIGABLE_ACHIEVEMENT_TYPES = new Set<GoalDTO['achievement_type']>([
  'rank_count',
  'score_count',
  'avg_score',
  'hardlamp_count',
  'combolamp_count',
])

const HARD_LAMP_FILTERS: Record<'HRD' | 'BRV' | 'ABS' | 'CTS', HardLamp[]> = {
  HRD: ['CLEAR', 'FAILED', null],
  BRV: ['HARD', 'CLEAR', 'FAILED', null],
  ABS: ['BRAVE', 'HARD', 'CLEAR', 'FAILED', null],
  CTS: ['ABSOLUTE', 'BRAVE', 'HARD', 'CLEAR', 'FAILED', null],
}

const COMBO_LAMP_FILTERS: Record<'FC' | 'AJ', ComboLamp[]> = {
  FC: [null],
  AJ: ['FULL COMBO', null],
}

/**
 * 単一値または配列で保持された目標属性 ID を配列へ正規化する。
 *
 * @param value - 目標属性に保存された ID。
 * @returns 有効な整数 ID の配列。
 */
const normalizeAttributeIds = (value: number | number[] | undefined): number[] => {
  if (typeof value === 'number') return [value]
  return Array.isArray(value) ? value.filter((id) => Number.isInteger(id)) : []
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
        score: { min: 0, max: Math.max(0, params.score - 1) },
      }
    }
    case 'hardlamp_count': {
      const params = goal.achievement_params as { lamp: 'HRD' | 'BRV' | 'ABS' | 'CTS' }
      return { ...filter, hard_lamp: [...HARD_LAMP_FILTERS[params.lamp]] }
    }
    case 'combolamp_count': {
      const params = goal.achievement_params as { lamp: 'FC' | 'AJ' }
      return { ...filter, combo_lamp: [...COMBO_LAMP_FILTERS[params.lamp]] }
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
  const difficultyIds = normalizeAttributeIds(goal.attributes.diff)
  const genreIds = normalizeAttributeIds(goal.attributes.genre)
  const versionIds = normalizeAttributeIds(goal.attributes.ver)
  const versionNameMap = buildGoalVersionNameMap(versions)
  const defaultFilter = buildDefaultFilter(masterData, versions)

  const filter: FilterState = {
    ...defaultFilter,
    title: '',
    difficulties: masterData.difficulties
      .filter((difficulty) => difficultyIds.length === 0 || difficultyIds.includes(difficulty.id))
      .map((difficulty) => difficulty.name.toUpperCase() as Difficulty),
    genres:
      genreIds.length === 0
        ? []
        : masterData.genres
            .filter((genre) => genreIds.includes(genre.id))
            .map((genre) => genre.name),
    versions:
      versionIds.length === 0
        ? []
        : versionIds.flatMap((versionId) => {
            const versionName = versionNameMap.get(versionId)
            return versionName ? [versionName] : []
          }),
    const: {
      min: goal.attributes.const?.min ?? CONST_MIN,
      max: goal.attributes.const?.max ?? CONST_MAX,
    },
    constFilterMode: 'number',
    score: { min: 0, max: MAX_SCORE },
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
  NAVIGABLE_ACHIEVEMENT_TYPES.has(goal.achievement_type)
