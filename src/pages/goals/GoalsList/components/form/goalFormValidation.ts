import { t } from '../../../../../i18n'
import { SCORE_MIN } from '../../../../../constants/chart'
import type { GoalAchievementType } from '../../../../../types/api'
import { truncateDecimal } from '../../../../../utils/numberFormat'
import { MAX_SCORE } from '../../../../../utils/scoreRank'
import type { GoalTargetMode } from '../../../utils/goalCountTarget'
import { GOAL_TITLE_MAX_LENGTH } from '../../constants'
import { GOAL_FORM_COPY, RATING_GOAL_DECIMAL_PLACES, RATING_GOAL_MIN_VALUE } from './constants'
import { canUseDynamicTotalTarget, getRankGoalScore, isCountAchievementType, type RankGoalValue } from './goalFormModel'

const MAX_OVERPOWER_PERCENT = 100
const OVERPOWER_TARGET_DECIMAL_PLACES = 3

export interface GoalFormValidationInput {
  title: string
  achievementType: GoalAchievementType
  score: string
  rating?: string
  rank: RankGoalValue
  count: string
  countMode: GoalTargetMode
  total: string
  totalMode: GoalTargetMode
  constMin: string
  constMax: string
  allCount: number
  theoreticalTotal: number
}

/**
 * 数値が指定した小数桁数以内か判定する。
 * `17.1` のような2進浮動小数点誤差は、既存の切り捨て処理と同じ許容差で吸収する。
 *
 * @param value - 判定対象の数値。
 * @param decimalPlaces - 許容する小数桁数。
 * @returns 許容範囲内ならtrue。
 */
export const isWithinDecimalPlaces = (value: number, decimalPlaces: number): boolean =>
  Number.isFinite(value) && truncateDecimal(value, decimalPlaces) === value

/**
 * 目標フォームの保存前検証を行う。
 *
 * @param input - 保存しようとしているフォーム値と、対象条件から解決した上限値。
 * @returns 検証エラーがあれば表示メッセージ、問題なければundefined。
 */
export const validateGoalForm = (input: GoalFormValidationInput): string | undefined => {
  const trimmed = input.title.trim()
  if (!trimmed) return t('goals.validation.titleRequired')
  if (trimmed.length > GOAL_TITLE_MAX_LENGTH) {
    return t('goals.validation.titleTooLong', { max: GOAL_TITLE_MAX_LENGTH })
  }

  const parsedScore =
    input.achievementType === 'rank_count' ? getRankGoalScore(input.rank) : Number(input.score)
  const parsedCount = Number(input.count)
  const parsedRating = Number(input.rating)
  const parsedTotal =
    canUseDynamicTotalTarget(input.achievementType) && input.totalMode === 'all'
      ? input.theoreticalTotal
      : Number(input.total)
  const parsedConstMin = input.constMin === '' ? undefined : Number(input.constMin)
  const parsedConstMax = input.constMax === '' ? undefined : Number(input.constMax)
  const isCountType = isCountAchievementType(input.achievementType)

  if (
    input.achievementType !== 'rainbow_count' &&
    ((typeof parsedConstMin === 'number' && !Number.isFinite(parsedConstMin)) ||
      (typeof parsedConstMax === 'number' && !Number.isFinite(parsedConstMax)))
  ) {
    return t('goals.validation.constRangeInvalid')
  }

  if (
    input.achievementType === 'rating_count' &&
    (!Number.isFinite(parsedRating) ||
      parsedRating < RATING_GOAL_MIN_VALUE ||
      !isWithinDecimalPlaces(parsedRating, RATING_GOAL_DECIMAL_PLACES))
  ) {
    return t('goals.validation.ratingInvalid', { min: RATING_GOAL_MIN_VALUE, places: RATING_GOAL_DECIMAL_PLACES })
  }
  if (
    input.achievementType !== 'rainbow_count' &&
    typeof parsedConstMin === 'number' &&
    typeof parsedConstMax === 'number' &&
    parsedConstMin > parsedConstMax
  ) {
    return t('goals.validation.constMinMax')
  }

  if (input.allCount <= 0) {
    return input.achievementType === 'rainbow_count'
      ? t('goals.validation.noSongs')
      : t('goals.validation.noCharts')
  }

  if (
    (input.achievementType === 'score_count' ||
      input.achievementType === 'rank_count' ||
      input.achievementType === 'avg_score') &&
    (!Number.isFinite(parsedScore) || parsedScore < SCORE_MIN || parsedScore > MAX_SCORE)
  ) {
    return t('goals.validation.scoreRange')
  }

  if (isCountType && input.countMode !== 'all') {
    const countMin = input.countMode === 'number' ? 1 : 0
    const requiresInteger = input.countMode !== 'percent'
    if (
      !Number.isFinite(parsedCount) ||
      (requiresInteger && !Number.isInteger(parsedCount)) ||
      parsedCount < countMin
    ) {
      return t('goals.validation.countMin', { label: input.countMode === 'percent' ? t('goals.validation.percentLabel') : t('goals.validation.countLabel'), min: countMin, kind: requiresInteger ? t('goals.validation.integer') : t('goals.validation.number') })
    }
    const countMax = input.countMode === 'percent' ? MAX_OVERPOWER_PERCENT : input.allCount
    if (parsedCount > countMax) {
      return t('goals.validation.countMax', { label: input.countMode === 'percent' ? t('goals.validation.percentLabel') : t('goals.validation.countLabel'), max: countMax.toLocaleString('ja-JP'), unit: input.countMode === 'percent' ? '%' : t('goals.validation.countUnit') })
    }
  }

  if (
    (input.achievementType === 'overpower_percent' ||
      (canUseDynamicTotalTarget(input.achievementType) && input.totalMode !== 'all')) &&
    (!Number.isFinite(parsedTotal) || parsedTotal < 0)
  ) {
    return t('goals.validation.totalMin')
  }

  if (input.achievementType === 'overpower_percent' && parsedTotal > MAX_OVERPOWER_PERCENT) {
    return t('goals.validation.overPowerPercentMax')
  }

  if (
    input.achievementType === 'total_score' &&
    (input.totalMode === 'number' || input.totalMode === 'remaining') &&
    !Number.isInteger(parsedTotal)
  ) {
    return t('goals.validation.totalScoreInteger')
  }

  if (
    input.achievementType === 'overpower_value' &&
    input.totalMode !== 'all' &&
    !isWithinDecimalPlaces(parsedTotal, OVERPOWER_TARGET_DECIMAL_PLACES)
  ) {
    return t('goals.validation.overPowerDecimal', { places: OVERPOWER_TARGET_DECIMAL_PLACES })
  }

  const dynamicTotalMax = canUseDynamicTotalTarget(input.achievementType)
    ? input.totalMode === 'percent'
      ? MAX_OVERPOWER_PERCENT
      : input.totalMode === 'all'
        ? undefined
        : input.theoreticalTotal
    : undefined
  if (dynamicTotalMax !== undefined && parsedTotal > dynamicTotalMax) {
    return t('goals.validation.totalMax', { label: input.achievementType === 'total_score'
        ? t('goals.validation.totalScoreTarget')
        : t('goals.validation.overPowerTotalTarget'), max: dynamicTotalMax.toLocaleString('ja-JP') })
  }

  if (isCountType && input.countMode === 'number' && parsedCount <= 0) {
    return GOAL_FORM_COPY.invalidCountTarget
  }

  return undefined
}
