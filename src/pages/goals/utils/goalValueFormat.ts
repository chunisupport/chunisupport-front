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

/** 表示文字列を数値と単位に分けた結果。 */
export interface GoalValueDisplayParts {
  /** 単位を除いた数値表示。 */
  numberText: string
  /** 数値の後ろに付ける単位。ない場合は空文字。 */
  unitText: string
}

/**
 * 表示文字列を数値と、末尾の単位に分ける。
 * 単位がない、または末尾が単位でない場合は文字列全体を数値として返す。
 * 分けた結果を連結すると、読み上げやコピーに使う元の文字列に戻る。
 *
 * @param text - 単位を含む表示文字列。
 * @param unit - 末尾に付いている単位。空文字なら分けない。
 * @returns 数値部分と単位部分。
 */
export const splitGoalValueDisplay = (text: string, unit: string): GoalValueDisplayParts => {
  if (unit !== '' && text.endsWith(unit)) {
    return { numberText: text.slice(0, -unit.length), unitText: unit }
  }
  return { numberText: text, unitText: '' }
}

/** 表示済み数値を整数部と小数部に分けた結果。 */
export interface GoalNumberTextParts {
  /** 小数点より前。小数がなければ文字列全体。 */
  integerText: string
  /** 小数点とそれ以降。小数がなければ空文字。 */
  fractionText: string
}

/**
 * 表示済みの数値文字列を整数部と小数部に分ける。
 * 小数点とそれ以降を小数部にする。小数点がない場合は分けない。
 * 連結すると元の文字列に戻る。
 *
 * @param numberText - 単位を除いた数値の表示文字列。
 * @returns 整数部と、小数点を含む小数部。
 */
export const splitGoalNumberText = (numberText: string): GoalNumberTextParts => {
  const decimalIndex = numberText.indexOf('.')
  if (decimalIndex === -1) {
    return { integerText: numberText, fractionText: '' }
  }
  return {
    integerText: numberText.slice(0, decimalIndex),
    fractionText: numberText.slice(decimalIndex),
  }
}
