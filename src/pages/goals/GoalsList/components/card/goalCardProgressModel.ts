import type { GoalAchievementType } from '../../../../../types/api'
import { formatTruncatedFixed, truncateDecimal } from '../../../../../utils/numberFormat'
import { formatOverPowerPercent } from '../../../../../utils/overPowerFormat'
import type { GoalProgressResult } from '../../../utils/goalProgress'

export interface GoalCardDisplayProgress {
  currentText: string
  targetText: string
  percentPrefixText: string
  percentText: string
  ariaValueText: string
  progressValue: number
}

/**
 * 総OVER POWERの表示で固定する小数点以下桁数。
 */
const OVER_POWER_VALUE_DECIMAL_PLACES = 3
const OVER_POWER_PERCENT_DECIMAL_PLACES = 3
const REMAINING_PERCENTAGE_PREFIX = 'あと'

/**
 * 目標進捗の数値を目標種別に合わせて表示用に整形する。
 *
 * @param value - 整形対象の数値。
 * @param type - 目標種別。
 * @returns 画面表示用の数値文字列。
 */
export const formatGoalCardValue = (value: number, type: GoalAchievementType): string => {
  if (type === 'overpower_value') {
    return truncateDecimal(value, OVER_POWER_VALUE_DECIMAL_PLACES).toLocaleString('ja-JP', {
      minimumFractionDigits: OVER_POWER_VALUE_DECIMAL_PLACES,
      maximumFractionDigits: OVER_POWER_VALUE_DECIMAL_PLACES,
    })
  }

  if (type === 'overpower_percent') {
    return formatOverPowerPercent(value, OVER_POWER_PERCENT_DECIMAL_PLACES)
  }

  return Math.floor(value).toLocaleString('ja-JP')
}

/**
 * 目標カードの進捗値とゲージ値を実表示用に変換する。
 *
 * @param progress - 目標進捗の現在値、目標値、達成率。
 * @param type - 目標種別。
 * @param invertValue - 実数値の反転表示が有効か。
 * @param invertPercentage - 割合の反転表示が有効か。
 * @returns カードに表示する現在値、目標値、達成率、ゲージ値。
 */
export const resolveGoalCardDisplayProgress = (
  progress: GoalProgressResult,
  type: GoalAchievementType,
  invertValue: boolean,
  invertPercentage: boolean
): GoalCardDisplayProgress => {
  const displayCurrent = invertValue
    ? Math.max(progress.target - progress.current, 0)
    : progress.current
  const safeTarget = progress.target <= 0 ? 1 : progress.target
  const raw = (progress.current / safeTarget) * 100
  const normalizedPercent = Number.isFinite(raw) ? Math.max(0, raw) : 0
  const displayPercent = invertPercentage
    ? Math.max(0, 100 - Math.min(normalizedPercent, 100))
    : normalizedPercent
  const progressValue = Math.max(0, Math.min(normalizedPercent, 100))
  const progressValueText = `${formatTruncatedFixed(progressValue, 2)}%`
  const displayPercentText = `${formatTruncatedFixed(displayPercent, 2)}%`

  return {
    currentText: formatGoalCardValue(displayCurrent, type),
    targetText: formatGoalCardValue(progress.target, type),
    percentPrefixText: invertPercentage ? REMAINING_PERCENTAGE_PREFIX : '',
    percentText: displayPercentText,
    ariaValueText: invertPercentage
      ? `達成率 ${progressValueText}、${REMAINING_PERCENTAGE_PREFIX}${displayPercentText}`
      : `達成率 ${progressValueText}`,
    progressValue,
  }
}
