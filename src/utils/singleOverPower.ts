import { MAX_RATING_SCORE } from './singleRating'

const CHART_CONSTANT_SCALE = 10
const OVER_POWER_SCALE = 1_000
const PERCENT_SCALE = 100_000
const S_SCORE = 975_000
const SS_SCORE = 1_000_000
const SS_PLUS_SCORE = 1_005_000
const SSS_SCORE = 1_007_500
const A_SCORE = 900_000
const BBB_SCORE = 800_000
const C_SCORE = 500_000
const BASE_MULTIPLIER = 500
const LOW_CONSTANT_OFFSET = 50
const LOW_SCORE_UNIT = 50
const HIGH_SCORE_UNIT = 5
const THEORETICAL_BONUS = 1_250
const ALL_JUSTICE_BONUS = 1_000
const FULL_COMBO_BONUS = 500
const PERCENT_MAX = 100

/** 単曲OVER POWERの値と譜面別理論値に対する達成率。 */
export interface SingleOverPower {
  value: number
  percent: number
}

/**
 * スコアとコンボランプから単曲OVER POWERを算出する。
 *
 * @param score - 対象スコア。
 * @param chartConstant - 対象譜面の定数。
 * @param comboLamp - APIのコンボランプ名。
 * @returns OP値と小数点以下5桁で切り捨てた譜面別OP達成率。
 */
export const calculateSingleOverPower = (
  score: number,
  chartConstant: number,
  comboLamp: string | null
): SingleOverPower => {
  const constantTenths = Math.round(chartConstant * CHART_CONSTANT_SCALE)
  const lowConstant = Math.max(constantTenths - LOW_CONSTANT_OFFSET, 0)
  let rawValue = 0

  if (score >= SSS_SCORE) {
    rawValue = (constantTenths + 20) * BASE_MULTIPLIER + Math.trunc(((score - SSS_SCORE) * 3) / 2)
  } else if (score >= SS_PLUS_SCORE) {
    rawValue = (constantTenths + 15) * BASE_MULTIPLIER + score - SS_PLUS_SCORE
  } else if (score >= SS_SCORE) {
    rawValue = (constantTenths + 10) * BASE_MULTIPLIER + Math.trunc((score - SS_SCORE) / 2)
  } else if (score >= S_SCORE) {
    rawValue = constantTenths * BASE_MULTIPLIER + Math.trunc((score - S_SCORE) / 5)
  } else if (score >= A_SCORE) {
    rawValue =
      (constantTenths - LOW_CONSTANT_OFFSET) * BASE_MULTIPLIER + Math.trunc((score - A_SCORE) / 3)
  } else if (score >= BBB_SCORE) {
    rawValue = lowConstant * 250 + Math.trunc(((score - BBB_SCORE) * lowConstant) / 400)
  } else if (score >= C_SCORE) {
    rawValue = Math.trunc(((score - C_SCORE) * lowConstant) / 1_200)
  }

  if (score === MAX_RATING_SCORE) rawValue += THEORETICAL_BONUS
  else if (comboLamp === 'ALL JUSTICE') rawValue += ALL_JUSTICE_BONUS
  else if (comboLamp === 'FULL COMBO') rawValue += FULL_COMBO_BONUS

  const unit = score >= S_SCORE ? HIGH_SCORE_UNIT : LOW_SCORE_UNIT
  const thousandths = Math.max(Math.trunc(rawValue / unit) * unit, 0)
  const maxThousandths = (constantTenths + 30) * BASE_MULTIPLIER
  return {
    value: thousandths / OVER_POWER_SCALE,
    percent:
      constantTenths <= 0
        ? 0
        : Math.min(
            Math.trunc((thousandths * PERCENT_MAX * PERCENT_SCALE) / maxThousandths),
            PERCENT_MAX * PERCENT_SCALE
          ) / PERCENT_SCALE,
  }
}
