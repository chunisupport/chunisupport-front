import { CHART_CONST_MAX, CHART_CONST_MIN, SCORE_MIN } from '../../../../../constants/chart'
import type {
  GoalAchievementParams,
  GoalAchievementType,
  GoalAttributes,
  GoalDTO,
} from '../../../../../types/api'
import {
  getScoreRank,
  MAX_SCORE,
  SCORE_RANK_MIN_SCORES,
  type ScoreRank,
} from '../../../../../utils/scoreRank'
import { buildGoalTargetParam, type GoalTargetMode } from '../../../utils/goalCountTarget'
import {
  type ComboLampGoalValue,
  type HardLampGoalValue,
  isComboLampGoalValue,
  isHardLampGoalValue,
} from '../../../utils/goalLamp'

export type RankGoalValue = ScoreRank | 'THEORETICAL'
export type GoalChartTargetMode = 'normal' | 'op_target'

export interface GoalFormState {
  title: string
  achievementType: GoalAchievementType
  score: string
  rank: RankGoalValue
  count: string
  countMode: GoalTargetMode
  total: string
  totalMode: GoalTargetMode
  hardLamp: HardLampGoalValue
  comboLamp: ComboLampGoalValue
  invert: boolean
  chartTargetMode: GoalChartTargetMode
  diffs: string[]
  constMin: string
  constMax: string
  genres: string[]
  versions: string[]
}

interface GoalFormSelectionFallbacks {
  allDifficultySelections: string[]
  allGenreSelections: string[]
  allVersionSelections: string[]
}

export interface GoalFormAttributesInput {
  achievementType: GoalAchievementType
  chartTargetMode: GoalChartTargetMode
  diffs: string[]
  constMin: string
  constMax: string
  genres: string[]
  versions: string[]
}

export interface GoalFormAchievementParamsInput {
  achievementType: GoalAchievementType
  score: string
  rank: RankGoalValue
  count: string
  countMode: GoalTargetMode
  total: string
  totalMode: GoalTargetMode
  hardLamp: HardLampGoalValue
  comboLamp: ComboLampGoalValue
}

export const DEFAULT_GOAL_ACHIEVEMENT_TYPE = 'rank_count' satisfies GoalAchievementType
export const DEFAULT_TOTAL_GOAL_VALUE = '10'
export const DEFAULT_TOTAL_SCORE_GOAL_VALUE = '1000000'
export const DEFAULT_OVERPOWER_VALUE_GOAL_VALUE = '10'
export const DEFAULT_OVERPOWER_PERCENT_GOAL_VALUE = '90'
export const DEFAULT_RANK_GOAL = 'S' satisfies RankGoalValue
export const THEORETICAL_RANK_GOAL = 'THEORETICAL' satisfies RankGoalValue

/**
 * ランク目標の選択値を保存用スコアへ変換する。
 *
 * @param value - ランク目標の選択値。
 * @returns APIへ送信するスコア目標値。
 */
export const getRankGoalScore = (value: RankGoalValue): number =>
  value === THEORETICAL_RANK_GOAL ? MAX_SCORE : SCORE_RANK_MIN_SCORES[value]

/**
 * 保存済みスコアからランク目標の選択値を復元する。
 *
 * @param score - APIから返されたスコア目標値。
 * @returns ダイアログで選択するランク目標値。
 */
export const getRankGoalValue = (score: number): RankGoalValue =>
  score >= MAX_SCORE ? THEORETICAL_RANK_GOAL : getScoreRank(score)

/**
 * 成果種別が件数目標として扱われるか判定する。
 *
 * @param type - 判定対象の成果種別。
 * @returns 件数目標ならtrue。
 */
export const isCountAchievementType = (type: GoalAchievementType): boolean =>
  type === 'score_count' ||
  type === 'rank_count' ||
  type === 'hardlamp_count' ||
  type === 'combolamp_count' ||
  type === 'rainbow_count'

/**
 * 成果パラメータから有効な数値を取り出す。
 *
 * @param params - 目標種別ごとの成果パラメータ。
 * @param key - 取り出すパラメータ名。
 * @returns 数値が設定されていればその値、未指定ならundefined。
 */
export const getOptionalNumberParam = (
  params: GoalDTO['achievement_params'],
  key: 'count' | 'total' | 'remaining' | 'percent'
): number | undefined => {
  const value = (params as Record<string, unknown>)[key]
  return typeof value === 'number' ? value : undefined
}

/**
 * 保存済み成果パラメータからフォームの目標値指定方法を解決する。
 *
 * @param params - APIから取得した成果パラメータ。
 * @param absoluteKey - 絶対値指定に使うキー。
 * @returns 保存済みキーに対応する指定方法。
 */
export const resolveGoalTargetMode = (
  params: GoalDTO['achievement_params'],
  absoluteKey: 'count' | 'total'
): GoalTargetMode => {
  if (getOptionalNumberParam(params, 'remaining') !== undefined) return 'remaining'
  if (getOptionalNumberParam(params, 'percent') !== undefined) return 'percent'
  if (getOptionalNumberParam(params, absoluteKey) !== undefined) return 'number'
  return 'all'
}

/**
 * 成果種別が動的な合計上限を利用できるか判定する。
 *
 * @param type - 判定対象の成果種別。
 * @returns 動的上限を選択できる成果種別ならtrue。
 */
export const canUseDynamicTotalTarget = (type: GoalAchievementType): boolean =>
  type === 'total_score' || type === 'overpower_value'

/**
 * 目標種別ごとの目標値入力の初期値を取得する。
 *
 * @param type - 選択された目標種別。
 * @returns 目標値欄に設定する初期値文字列。
 */
export const getDefaultTotalGoalValue = (type: GoalAchievementType): string =>
  type === 'total_score'
    ? DEFAULT_TOTAL_SCORE_GOAL_VALUE
    : type === 'overpower_value'
      ? DEFAULT_OVERPOWER_VALUE_GOAL_VALUE
      : type === 'overpower_percent'
        ? DEFAULT_OVERPOWER_PERCENT_GOAL_VALUE
        : DEFAULT_TOTAL_GOAL_VALUE

/**
 * API属性に保存された単一IDまたはID配列をフォーム用の文字列配列へ変換する。
 *
 * @param value - API属性に保存されたID指定。
 * @returns フォームのチェック状態として扱う文字列ID配列。
 */
export const normalizeAttributeSelection = (value: number | number[] | undefined): string[] => {
  if (typeof value === 'number') return [String(value)]
  if (Array.isArray(value)) {
    return value
      .filter((item): item is number => Number.isInteger(item))
      .map((item) => String(item))
  }
  return []
}

/**
 * フォームの選択値をAPI属性で使う単一IDまたはID配列へ変換する。
 *
 * @param selectedValues - フォーム上で選択されている文字列ID配列。
 * @returns 選択値が1件なら単一数値、それ以外は数値配列。
 */
export const parseAttributeSelection = (selectedValues: string[]): number | number[] => {
  const normalized = Array.from(new Set(selectedValues))
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value))

  if (normalized.length === 1) return normalized[0]
  return normalized
}

/**
 * マスタデータのID一覧をフォーム用の全選択値へ変換する。
 *
 * @param items - IDを持つマスタデータ一覧。
 * @returns 全項目を選択済みにする文字列ID配列。
 */
export const buildAllIdSelections = (items: readonly { id: number }[]): string[] =>
  items.map((item) => String(item.id))

/**
 * 保存済み属性が未指定の場合だけ、現在の全選択値で補完する。
 *
 * @param value - API属性に保存されたID指定。
 * @param fallbackValues - 属性未指定時に使う全選択値。
 * @returns 編集フォームへ反映する選択値。
 */
export const resolveInitialAttributeSelection = (
  value: number | number[] | undefined,
  fallbackValues: string[]
): string[] => (value === undefined ? fallbackValues : normalizeAttributeSelection(value))

/**
 * バージョン選択肢をフォーム用の全選択値へ変換する。
 *
 * @param options - 目標フォームで表示するバージョン選択肢。
 * @returns 全バージョンを選択済みにする値配列。
 */
export const buildAllVersionSelections = (options: readonly { value: string }[]): string[] =>
  options.map((option) => option.value)

/**
 * チェックボックスの選択状態を更新する。
 *
 * @param current - 現在の選択値一覧。
 * @param value - 操作対象の選択値。
 * @param checked - チェック後の状態。
 * @returns 更新後の選択値一覧。
 */
export const toggleSelection = (current: string[], value: string, checked: boolean): string[] => {
  if (checked) {
    return current.includes(value) ? current : [...current, value]
  }
  return current.filter((item) => item !== value)
}

/**
 * 作成フォームで使う初期状態を作成する。
 *
 * @param fallbacks - マスタデータ由来の全選択値。
 * @returns 作成フォームの初期状態。
 */
export const createDefaultGoalFormState = (
  fallbacks: GoalFormSelectionFallbacks
): GoalFormState => ({
  title: '',
  achievementType: DEFAULT_GOAL_ACHIEVEMENT_TYPE,
  score: String(getRankGoalScore(DEFAULT_RANK_GOAL)),
  rank: DEFAULT_RANK_GOAL,
  count: '1',
  countMode: 'all',
  total: getDefaultTotalGoalValue(DEFAULT_GOAL_ACHIEVEMENT_TYPE),
  totalMode: 'number',
  hardLamp: 'HRD',
  comboLamp: 'FC',
  invert: false,
  chartTargetMode: 'normal',
  diffs: fallbacks.allDifficultySelections,
  constMin: String(CHART_CONST_MIN),
  constMax: String(CHART_CONST_MAX),
  genres: fallbacks.allGenreSelections,
  versions: fallbacks.allVersionSelections,
})

/**
 * 作成・編集モードに応じたフォーム初期状態を作成する。
 *
 * @param goal - 編集対象の保存済み目標。未指定なら作成用初期状態を返す。
 * @param fallbacks - マスタデータ由来の全選択値。
 * @returns ダイアログを開いた直後にSignalへ反映するフォーム状態。
 */
export const createGoalFormInitialState = (
  goal: GoalDTO | undefined,
  fallbacks: GoalFormSelectionFallbacks
): GoalFormState => {
  const defaultState = createDefaultGoalFormState(fallbacks)
  if (!goal) return defaultState

  const rawCount = getOptionalNumberParam(goal.achievement_params, 'count')
  const rawRemaining = getOptionalNumberParam(goal.achievement_params, 'remaining')
  const rawPercent = getOptionalNumberParam(goal.achievement_params, 'percent')
  const rawTotal = getOptionalNumberParam(goal.achievement_params, 'total')
  const countTargetValue = rawCount ?? rawRemaining ?? rawPercent
  const totalTargetValue = rawTotal ?? rawRemaining ?? rawPercent
  const scoreValue = 'score' in goal.achievement_params ? goal.achievement_params.score : undefined
  const lampValue = 'lamp' in goal.achievement_params ? goal.achievement_params.lamp : undefined
  const hardLampValue =
    typeof lampValue === 'string' && isHardLampGoalValue(lampValue) ? lampValue : undefined
  const comboLampValue =
    typeof lampValue === 'string' && isComboLampGoalValue(lampValue) ? lampValue : undefined

  return {
    ...defaultState,
    title: goal.title,
    achievementType: goal.achievement_type,
    score: typeof scoreValue === 'number' ? String(scoreValue) : defaultState.score,
    rank:
      typeof scoreValue === 'number' && goal.achievement_type === 'rank_count'
        ? getRankGoalValue(scoreValue)
        : defaultState.rank,
    count: typeof countTargetValue === 'number' ? String(countTargetValue) : defaultState.count,
    countMode: isCountAchievementType(goal.achievement_type)
      ? resolveGoalTargetMode(goal.achievement_params, 'count')
      : 'number',
    total: typeof totalTargetValue === 'number' ? String(totalTargetValue) : defaultState.total,
    totalMode: canUseDynamicTotalTarget(goal.achievement_type)
      ? resolveGoalTargetMode(goal.achievement_params, 'total')
      : 'number',
    hardLamp: hardLampValue ?? defaultState.hardLamp,
    comboLamp: comboLampValue ?? defaultState.comboLamp,
    invert: goal.invert,
    chartTargetMode: goal.attributes.chart_target === 'OP_TARGET' ? 'op_target' : 'normal',
    diffs: resolveInitialAttributeSelection(
      goal.attributes.diff,
      fallbacks.allDifficultySelections
    ),
    constMin:
      typeof goal.attributes.const?.min === 'number'
        ? String(goal.attributes.const.min)
        : String(CHART_CONST_MIN),
    constMax:
      typeof goal.attributes.const?.max === 'number'
        ? String(goal.attributes.const.max)
        : String(CHART_CONST_MAX),
    genres: resolveInitialAttributeSelection(goal.attributes.genre, fallbacks.allGenreSelections),
    versions: resolveInitialAttributeSelection(goal.attributes.ver, fallbacks.allVersionSelections),
  }
}

/**
 * 現在のフォーム選択値からAPI送信用の対象属性を作成する。
 *
 * @param input - 対象譜面セクションのフォーム値。
 * @returns API送信値と同じ形の対象属性。
 */
export const buildGoalFormAttributes = (input: GoalFormAttributesInput): GoalAttributes => ({
  ...(input.achievementType !== 'rainbow_count' && input.chartTargetMode === 'op_target'
    ? { chart_target: 'OP_TARGET' as const }
    : {}),
  ...(input.achievementType !== 'rainbow_count' && input.chartTargetMode === 'normal'
    ? { diff: parseAttributeSelection(input.diffs) }
    : {}),
  ...(input.achievementType !== 'rainbow_count' && (input.constMin || input.constMax)
    ? {
        const: {
          ...(input.constMin ? { min: Number(input.constMin) } : {}),
          ...(input.constMax ? { max: Number(input.constMax) } : {}),
        },
      }
    : {}),
  genre: parseAttributeSelection(input.genres),
  ver: parseAttributeSelection(input.versions),
})

/**
 * 現在のフォーム入力値から保存・プレビュー共通の成果パラメータを組み立てる。
 *
 * @param input - 達成条件セクションのフォーム値。
 * @returns API送信値と同じ形の成果パラメータ。
 */
export const buildGoalFormAchievementParams = (
  input: GoalFormAchievementParamsInput
): GoalAchievementParams => {
  const parsedScore =
    input.achievementType === 'rank_count' ? getRankGoalScore(input.rank) : Number(input.score)
  const targetCountParam = buildGoalTargetParam(input.countMode, input.count, 'count')
  const targetTotalParam = buildGoalTargetParam(input.totalMode, input.total, 'total')

  return input.achievementType === 'score_count' || input.achievementType === 'rank_count'
    ? {
        score: Math.floor(Number.isFinite(parsedScore) ? parsedScore : SCORE_MIN),
        ...targetCountParam,
      }
    : input.achievementType === 'avg_score'
      ? { score: Math.floor(Number.isFinite(parsedScore) ? parsedScore : SCORE_MIN) }
      : input.achievementType === 'hardlamp_count'
        ? {
            lamp: input.hardLamp,
            ...targetCountParam,
          }
        : input.achievementType === 'combolamp_count'
          ? {
              lamp: input.comboLamp,
              ...targetCountParam,
            }
          : input.achievementType === 'rainbow_count'
            ? targetCountParam
            : canUseDynamicTotalTarget(input.achievementType)
              ? targetTotalParam
              : { total: Number.isFinite(Number(input.total)) ? Number(input.total) : 0 }
}
