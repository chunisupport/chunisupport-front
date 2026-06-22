export const MIN_CHART_CONSTANT_SCORE = 975000
export const MAX_CHART_CONSTANT_SCORE = 1010000

const SSS_SCORE = 1007500
const OP_MULTIPLIER = 5
const SSS_CONSTANT_BONUS = 2
const SSS_OVER_POWER_RATE = 0.0015
const CHART_CONSTANT_PRECISION = 10
const RAW_CHART_CONSTANT_PRECISION = 1_000_000_000_000

export const LAMP_BONUSES = {
  NONE: 0,
  FULL_COMBO: 0.5,
  ALL_JUSTICE: 1,
  ALL_JUSTICE_CRITICAL: 1.25,
} as const

export type ChartConstantLamp = keyof typeof LAMP_BONUSES

export type ChartConstantCalculatorInput = {
  score: number
  overPower: number
  lamp: ChartConstantLamp
}

export type ChartConstantCalculatorResult = {
  rawChartConstant: number
  estimatedChartConstant: number
}

/**
 * スコア変更時に適用するランプを決定する。
 *
 * @param score - 入力されたスコア。
 * @param currentLamp - 現在選択中のランプ。
 * @returns 理論値ならALL JUSTICE CRITICAL、それ以外は現在のランプ。
 */
export const resolveLampForScore = (
  score: number,
  currentLamp: ChartConstantLamp
): ChartConstantLamp => (score === MAX_CHART_CONSTANT_SCORE ? 'ALL_JUSTICE_CRITICAL' : currentLamp)

/**
 * S〜SSS帯のスコアから単曲レート補正を計算する。
 *
 * @param score - 975,000〜1,007,500のスコア。
 * @returns スコア帯に対応する単曲レート補正。
 */
const calculateRateCorrection = (score: number): number => {
  if (score < 1000000) return (score - 975000) / 25000
  if (score < 1005000) return 1 + (score - 1000000) / 10000
  return 1.5 + (score - 1005000) / 5000
}

/**
 * 譜面定数計算機の入力値を検証する。
 *
 * @param input - スコア、OVER POWER、ランプ状態。
 * @returns 入力値が計算可能な場合はエラーを投げずに終了する。
 */
const assertValidInput = (input: ChartConstantCalculatorInput): void => {
  if (
    !Number.isInteger(input.score) ||
    input.score < MIN_CHART_CONSTANT_SCORE ||
    input.score > MAX_CHART_CONSTANT_SCORE
  ) {
    throw new Error('スコアは975,000〜1,010,000の整数で入力してください。')
  }
  if (!Number.isFinite(input.overPower) || input.overPower < 0) {
    throw new Error('OVER POWERは0以上の数値で入力してください。')
  }
}

/**
 * スコア、OVER POWER、ランプ状態から譜面定数を逆算する。
 *
 * @param input - 初回反映時のOVER POWERを含む計算条件。
 * @returns 逆算した生の譜面定数と小数第1位に丸めた推定値。
 */
export const calculateChartConstant = (
  input: ChartConstantCalculatorInput
): ChartConstantCalculatorResult => {
  assertValidInput(input)

  const lampBonus = LAMP_BONUSES[input.lamp]
  const calculatedChartConstant =
    input.score > SSS_SCORE
      ? (input.overPower - lampBonus - (input.score - SSS_SCORE) * SSS_OVER_POWER_RATE) /
          OP_MULTIPLIER -
        SSS_CONSTANT_BONUS
      : (input.overPower - lampBonus) / OP_MULTIPLIER - calculateRateCorrection(input.score)
  const rawChartConstant =
    Math.round(calculatedChartConstant * RAW_CHART_CONSTANT_PRECISION) /
    RAW_CHART_CONSTANT_PRECISION

  return {
    rawChartConstant,
    estimatedChartConstant:
      Math.round((rawChartConstant + Number.EPSILON) * CHART_CONSTANT_PRECISION) /
      CHART_CONSTANT_PRECISION,
  }
}
