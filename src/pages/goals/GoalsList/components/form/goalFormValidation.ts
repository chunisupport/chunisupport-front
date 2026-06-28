import { SCORE_MIN } from '../../../../../constants/chart'
import type { GoalAchievementType } from '../../../../../types/api'
import { MAX_SCORE } from '../../../../../utils/scoreRank'
import type { GoalTargetMode } from '../../../utils/goalCountTarget'
import { ERROR_MESSAGE_INVALID_COUNT_TARGET, GOAL_TITLE_MAX_LENGTH } from './constants'
import {
  canUseDynamicTotalTarget,
  getRankGoalScore,
  isCountAchievementType,
  type RankGoalValue,
} from './goalFormModel'

const MAX_OVERPOWER_PERCENT = 100
const OVERPOWER_TARGET_DECIMAL_PLACES = 3

export interface GoalFormValidationInput {
  title: string
  achievementType: GoalAchievementType
  score: string
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
 *
 * @param value - 判定対象の数値。
 * @param decimalPlaces - 許容する小数桁数。
 * @returns 許容範囲内ならtrue。
 */
export const isWithinDecimalPlaces = (value: number, decimalPlaces: number): boolean => {
  const scale = 10 ** decimalPlaces
  return Math.abs(value * scale - Math.round(value * scale)) < Number.EPSILON * scale
}

/**
 * 目標フォームの保存前検証を行う。
 *
 * @param input - 保存しようとしているフォーム値と、対象条件から解決した上限値。
 * @returns 検証エラーがあれば表示メッセージ、問題なければundefined。
 */
export const validateGoalForm = (input: GoalFormValidationInput): string | undefined => {
  const trimmed = input.title.trim()
  if (!trimmed) return 'タイトルを入力してください。'
  if (trimmed.length > GOAL_TITLE_MAX_LENGTH) {
    return `タイトルは${GOAL_TITLE_MAX_LENGTH}文字以内で入力してください。`
  }

  const parsedScore =
    input.achievementType === 'rank_count' ? getRankGoalScore(input.rank) : Number(input.score)
  const parsedCount = Number(input.count)
  const parsedTotal =
    canUseDynamicTotalTarget(input.achievementType) && input.totalMode === 'all'
      ? input.theoreticalTotal
      : Number(input.total)
  const parsedConstMin = input.constMin === '' ? undefined : Number(input.constMin)
  const parsedConstMax = input.constMax === '' ? undefined : Number(input.constMax)

  if (
    (input.achievementType === 'score_count' ||
      input.achievementType === 'rank_count' ||
      input.achievementType === 'avg_score') &&
    (!Number.isFinite(parsedScore) || parsedScore < SCORE_MIN || parsedScore > MAX_SCORE)
  ) {
    return 'スコアは 0 ～ 1,010,000 の範囲で入力してください。'
  }

  const isCountType = isCountAchievementType(input.achievementType)

  if (isCountType && input.countMode !== 'all') {
    const countMin = input.countMode === 'number' ? 1 : 0
    const requiresInteger = input.countMode !== 'percent'
    if (
      !Number.isFinite(parsedCount) ||
      (requiresInteger && !Number.isInteger(parsedCount)) ||
      parsedCount < countMin
    ) {
      const inputLabel = input.countMode === 'percent' ? '割合' : '件数'
      return `${inputLabel}は${countMin}以上の${requiresInteger ? '整数' : '数値'}で入力してください。`
    }
    const countMax = input.countMode === 'percent' ? MAX_OVERPOWER_PERCENT : input.allCount
    if (parsedCount > countMax) {
      const unit = input.countMode === 'percent' ? '%' : '件'
      return `${input.countMode === 'percent' ? '割合' : '件数'}は${countMax.toLocaleString('ja-JP')}${unit}以内で入力してください。`
    }
  }

  if (isCountType && input.countMode === 'all' && input.allCount <= 0) {
    return '条件に当てはまる譜面がありません。条件を見直してください。'
  }

  if (
    canUseDynamicTotalTarget(input.achievementType) &&
    input.totalMode === 'all' &&
    input.allCount <= 0
  ) {
    return '条件に当てはまる譜面がありません。条件を見直してください。'
  }

  if (
    (input.achievementType === 'overpower_percent' ||
      (canUseDynamicTotalTarget(input.achievementType) && input.totalMode !== 'all')) &&
    (!Number.isFinite(parsedTotal) || parsedTotal < 0)
  ) {
    return '合計/割合の目標値は0以上で入力してください。'
  }

  if (input.achievementType === 'overpower_percent' && parsedTotal > MAX_OVERPOWER_PERCENT) {
    return 'OVER POWER達成率は100%以下で入力してください。'
  }

  if (
    input.achievementType === 'total_score' &&
    (input.totalMode === 'number' || input.totalMode === 'remaining') &&
    !Number.isInteger(parsedTotal)
  ) {
    return '総スコアの目標値と残数は整数で入力してください。'
  }

  if (
    input.achievementType === 'overpower_value' &&
    input.totalMode !== 'all' &&
    !isWithinDecimalPlaces(parsedTotal, OVERPOWER_TARGET_DECIMAL_PLACES)
  ) {
    return `OVER POWERの目標値・残数・割合は小数第${OVERPOWER_TARGET_DECIMAL_PLACES}位以内で入力してください。`
  }

  const dynamicTotalMax = canUseDynamicTotalTarget(input.achievementType)
    ? input.totalMode === 'percent'
      ? MAX_OVERPOWER_PERCENT
      : input.totalMode === 'all'
        ? undefined
        : input.theoreticalTotal
    : undefined
  if (dynamicTotalMax !== undefined && parsedTotal > dynamicTotalMax) {
    const targetLabel =
      input.achievementType === 'total_score' ? '総スコア目標' : 'OVER POWER合計目標'
    return `${targetLabel}は最大 ${dynamicTotalMax.toLocaleString('ja-JP')} 以下で入力してください。`
  }

  if (
    (typeof parsedConstMin === 'number' && !Number.isFinite(parsedConstMin)) ||
    (typeof parsedConstMax === 'number' && !Number.isFinite(parsedConstMax))
  ) {
    return '定数範囲が不正です。'
  }
  if (
    typeof parsedConstMin === 'number' &&
    typeof parsedConstMax === 'number' &&
    parsedConstMin > parsedConstMax
  ) {
    return '定数の最小値は最大値以下にしてください。'
  }

  if (isCountType && input.countMode === 'number' && parsedCount <= 0) {
    return ERROR_MESSAGE_INVALID_COUNT_TARGET
  }

  return undefined
}
