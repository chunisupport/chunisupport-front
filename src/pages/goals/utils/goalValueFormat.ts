import type { GoalAchievementType } from '../../../types/api'
import { truncateDecimal } from '../../../utils/numberFormat'
import { formatOverPowerPercent } from '../../../utils/overPowerFormat'

/** 総OVER POWERの表示で固定する小数点以下桁数。 */
const OVER_POWER_VALUE_DECIMAL_PLACES = 3
/** OVER POWER達成率の表示で固定する小数点以下桁数。 */
const OVER_POWER_PERCENT_DECIMAL_PLACES = 3

/**
 * 目標種別ごとの表示単位。
 * OP%だけ「%」を付け、ほかの種別は従来どおり単位なし。
 */
const GOAL_VALUE_UNITS = {
  rank_count: '',
  score_count: '',
  rating_count: '',
  avg_score: '',
  hardlamp_count: '',
  combolamp_count: '',
  fullchain_count: '',
  rainbow_count: '',
  total_score: '',
  overpower_value: '',
  overpower_percent: '%',
} as const satisfies Record<GoalAchievementType, string>

/**
 * 目標種別の表示単位を返す。
 * 保存値やAPIの値には付けず、画面上の数値の後ろにだけ使う。
 *
 * @param type - 目標種別。
 * @returns 数値の後ろに付ける単位。単位を付けない種別は空文字。
 */
export const getGoalValueUnit = (type: GoalAchievementType): string => GOAL_VALUE_UNITS[type]

/**
 * 目標の数値を種別に合わせて整形する。単位は付けない。
 *
 * @param value - 整形対象の数値。
 * @param type - 目標種別。
 * @returns 小数桁や桁区切りだけを反映した表示文字列。
 */
const formatGoalValueNumber = (value: number, type: GoalAchievementType): string => {
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
 * 目標の数値を種別に合わせて整形し、種別に応じた単位を付ける。
 * 保存値やAPIの値は変えず、画面表示だけに使う。
 *
 * @param value - 整形対象の数値。
 * @param type - 目標種別。
 * @returns 画面表示用の数値文字列。OP%の場合は末尾に「%」を付ける。
 */
export const formatGoalValue = (value: number, type: GoalAchievementType): string =>
  `${formatGoalValueNumber(value, type)}${getGoalValueUnit(type)}`
