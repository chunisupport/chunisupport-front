import type { GoalAchievementType } from '../../../../../types/api'
import { formatTruncatedFixed } from '../../../../../utils/numberFormat'
import { calculateGoalGaugePercent, resolveGoalGaugeStart } from '../../../utils/goalGauge'
import type { GoalProgressResult } from '../../../utils/goalProgress'
import { formatGoalValue } from '../../../utils/goalValueFormat'
import { GOAL_SCORE_UNIT } from '../../constants'

export interface GoalCardDisplayProgress {
  currentText: string
  targetText: string
  percentPrefixText: string
  percentText: string
  /** 数値と文字サイズを分けて表示する単位。 */
  percentSuffixText?: string
  ariaValueText: string
  progressValue: number
  /** ゲージの左下に添えるスタート位置。スタート位置を使わない場合は未定義。 */
  gaugeStartText?: string
}

/** 目標カードのゲージをどこから描くかの表示設定。 */
export interface GoalGaugeStartSettings {
  /** 目標に保存されたゲージのスタート位置。0なら従来どおり0から描く。 */
  value: number
  /** 達成率表示もゲージと同じくスタート位置から計算するか。 */
  applyToPercentage: boolean
}

const REMAINING_PERCENTAGE_PREFIX = 'あと'
/** スタート位置を指定しない場合の設定。従来どおり0からゲージを描き、達成率も現在値÷目標値にする。 */
const NO_GAUGE_START: GoalGaugeStartSettings = { value: 0, applyToPercentage: false }

/**
 * 目標進捗の数値を目標種別に合わせて表示用に整形する。
 * OP%だけ末尾に「%」を付ける。
 *
 * @param value - 整形対象の数値。
 * @param type - 目標種別。
 * @returns 画面表示用の数値文字列。
 */
export const formatGoalCardValue = formatGoalValue

/**
 * 目標カードの進捗値とゲージ値を実表示用に変換する。
 * ゲージは常にスタート位置から描き、達成率表示は設定に応じてスタート位置からの割合か、
 * 現在値÷目標値の割合を使う。
 *
 * @param progress - 目標進捗の現在値、目標値、達成率。
 * @param type - 目標種別。
 * @param invertValue - 実数値の反転表示が有効か。
 * @param invertPercentage - 割合の反転表示が有効か。
 * @param gaugeStart - ゲージのスタート位置と、達成率表示への適用有無。省略時は0から描く。
 * @returns カードに表示する現在値、目標値、達成率または平均目標の残り点数、ゲージ値、スタート位置。
 */
export const resolveGoalCardDisplayProgress = (
  progress: GoalProgressResult,
  type: GoalAchievementType,
  invertValue: boolean,
  invertPercentage: boolean,
  gaugeStart: GoalGaugeStartSettings = NO_GAUGE_START
): GoalCardDisplayProgress => {
  const isAverageScore = type === 'avg_score'
  const displayCurrent =
    invertValue && !isAverageScore
      ? Math.max(progress.target - progress.current, 0)
      : progress.current
  const effectiveGaugeStart = resolveGoalGaugeStart(gaugeStart.value, progress.target)
  const gaugePercent = calculateGoalGaugePercent(
    progress.current,
    progress.target,
    gaugeStart.value
  )
  const achievementPercent = gaugeStart.applyToPercentage
    ? gaugePercent
    : calculateGoalGaugePercent(progress.current, progress.target, 0)
  const displayPercent = invertPercentage
    ? Math.max(0, 100 - Math.min(achievementPercent, 100))
    : achievementPercent
  const progressValue = Math.min(gaugePercent, 100)
  const displayPercentText = `${formatTruncatedFixed(displayPercent, 2)}%`
  const gaugeStartDisplay =
    effectiveGaugeStart > 0
      ? { gaugeStartText: formatGoalCardValue(effectiveGaugeStart, type) }
      : {}

  if (isAverageScore) {
    const progressValueText = `${formatTruncatedFixed(progressValue, 2)}%`
    const remainingText = `${formatGoalCardValue(progress.remainingScore ?? 0, type)}${GOAL_SCORE_UNIT}`
    return {
      currentText: formatGoalCardValue(progress.current, type),
      targetText: formatGoalCardValue(progress.target, type),
      percentPrefixText: REMAINING_PERCENTAGE_PREFIX,
      percentText: formatGoalCardValue(progress.remainingScore ?? 0, type),
      percentSuffixText: GOAL_SCORE_UNIT,
      ariaValueText: `達成率 ${progressValueText}、${REMAINING_PERCENTAGE_PREFIX}${remainingText}`,
      progressValue,
      ...gaugeStartDisplay,
    }
  }

  // 読み上げは画面の割合表示と同じ数値にそろえる。
  const achievementPercentText = `${formatTruncatedFixed(Math.min(achievementPercent, 100), 2)}%`
  return {
    currentText: formatGoalCardValue(displayCurrent, type),
    targetText: formatGoalCardValue(progress.target, type),
    percentPrefixText: invertPercentage ? REMAINING_PERCENTAGE_PREFIX : '',
    percentText: displayPercentText,
    ariaValueText: invertPercentage
      ? `達成率 ${achievementPercentText}、${REMAINING_PERCENTAGE_PREFIX}${displayPercentText}`
      : `達成率 ${achievementPercentText}`,
    progressValue,
    ...gaugeStartDisplay,
  }
}
