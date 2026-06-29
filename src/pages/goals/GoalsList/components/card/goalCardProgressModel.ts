import type { GoalAchievementType } from '../../../../../types/api'
import { formatTruncatedFixed } from '../../../../../utils/numberFormat'
import type { GoalProgressResult } from '../../../utils/goalProgress'

export interface GoalCardDisplayProgress {
  currentText: string
  targetText: string
  percentText: string
  ariaValueText: string
  progressValue: number
}

/**
 * 総OVER POWERの表示で固定する小数点以下桁数。
 */
const OVER_POWER_VALUE_DECIMAL_PLACES = 3

/**
 * 目標進捗の数値を目標種別に合わせて表示用に整形する。
 *
 * @param value - 整形対象の数値。
 * @param type - 目標種別。
 * @returns 画面表示用の数値文字列。
 */
export const formatGoalCardValue = (value: number, type: GoalAchievementType): string => {
  if (type === 'overpower_value') {
    return value.toLocaleString('ja-JP', {
      minimumFractionDigits: OVER_POWER_VALUE_DECIMAL_PLACES,
      maximumFractionDigits: OVER_POWER_VALUE_DECIMAL_PLACES,
    })
  }

  if (type === 'overpower_percent') {
    return value.toLocaleString('ja-JP', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    })
  }

  return Math.floor(value).toLocaleString('ja-JP')
}

/**
 * 目標カードの進捗値とゲージ値を実表示用に変換する。
 *
 * @param progress - 目標進捗の現在値、目標値、達成率。
 * @param type - 目標種別。
 * @param invert - 反転表示が有効か。
 * @returns カードに表示する現在値、目標値、達成率、ゲージ値。
 */
export const resolveGoalCardDisplayProgress = (
  progress: GoalProgressResult,
  type: GoalAchievementType,
  invert: boolean
): GoalCardDisplayProgress => {
  const displayCurrent = invert ? Math.max(progress.target - progress.current, 0) : progress.current
  const safeTarget = progress.target <= 0 ? 1 : progress.target
  const raw = (progress.current / safeTarget) * 100
  const normalizedPercent = Number.isFinite(raw) ? Math.max(0, raw) : 0
  const displayPercent = invert
    ? Math.max(0, 100 - Math.min(normalizedPercent, 100))
    : normalizedPercent
  const progressValue = Math.max(0, Math.min(normalizedPercent, 100))
  const progressValueText = `${formatTruncatedFixed(progressValue, 2)}%`
  const displayPercentText = `${formatTruncatedFixed(displayPercent, 2)}%`

  return {
    currentText: formatGoalCardValue(displayCurrent, type),
    targetText: formatGoalCardValue(progress.target, type),
    percentText: displayPercentText,
    ariaValueText: invert
      ? `達成率 ${progressValueText}、残り ${displayPercentText}`
      : `達成率 ${progressValueText}`,
    progressValue,
  }
}
