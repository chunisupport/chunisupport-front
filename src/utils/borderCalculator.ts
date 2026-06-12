export const CHUNITHM_THEORETICAL_SCORE = 1010000

const SCORE_DENOMINATOR = 10000
const JC_POINT = 101
const JUSTICE_LOSS = 1
const ATTACK_LOSS = 51
const MISS_LOSS = 101

export type BorderCalculatorInput = {
  notes: number
  targetScore: number
  targetJustice?: number
  fullComboOnly?: boolean
}

export type BorderCalculatorRow = {
  justice: number
  attack: number
  miss: number
  loss: number
  score: number
}

export type BorderCalculatorResult =
  | {
      mode: 'summary'
      reachable: true
      justice: number
      attack: number
      miss: number
      lossBudget: number
      score: number
    }
  | {
      mode: 'candidates'
      reachable: true
      lossBudget: number
      candidates: BorderCalculatorRow[]
    }
  | {
      mode: 'summary' | 'candidates'
      reachable: false
      lossBudget: number
      score: 0
    }

/**
 * ボーダー計算用の入力値が整数範囲を満たすか検証する。
 *
 * @param input - ノーツ数、目標スコア、任意の目標JUSTICE数。
 * @returns 入力値が計算可能な場合はエラーを投げずに終了する。
 */
const assertValidBorderInput = (input: BorderCalculatorInput): void => {
  if (!Number.isInteger(input.notes) || input.notes <= 0) {
    throw new Error('ノーツ数は1以上の整数で入力してください。')
  }
  if (!Number.isInteger(input.targetScore) || input.targetScore < 0) {
    throw new Error('目標スコアは0以上の整数で入力してください。')
  }
  if (input.targetJustice === undefined) return
  if (!Number.isInteger(input.targetJustice) || input.targetJustice < 0) {
    throw new Error('目標JUSTICE数は0以上の整数で入力してください。')
  }
  if (input.targetJustice > input.notes) {
    throw new Error('目標JUSTICE数はノーツ数以下で入力してください。')
  }
}

/**
 * 整数除算の切り上げ結果を返す。
 *
 * @param numerator - 分子。
 * @param denominator - 分母。
 * @returns numerator / denominator を切り上げた整数。
 */
const ceilDiv = (numerator: number, denominator: number): number =>
  Math.floor((numerator + denominator - 1) / denominator)

/**
 * 目標スコア達成に使える失点量を計算する。
 *
 * @param notes - 譜面の総ノーツ数。
 * @param targetScore - 目標スコア。
 * @returns 許容失点。負数の場合は理論値を超えている。
 */
export const calculateLossBudget = (notes: number, targetScore: number): number => {
  const requiredPoint = ceilDiv(targetScore * notes, SCORE_DENOMINATOR)
  return JC_POINT * notes - requiredPoint
}

/**
 * 下位判定数から実際の到達スコアを再計算する。
 *
 * @param notes - 譜面の総ノーツ数。
 * @param justice - JUSTICE数。
 * @param attack - ATTACK数。
 * @param miss - MISS数。
 * @returns CHUNITHMの整数スコア。
 */
export const calculateBorderScore = (
  notes: number,
  justice: number,
  attack: number,
  miss: number
): number => {
  const justiceCritical = notes - justice - attack - miss
  const point = JC_POINT * justiceCritical + 100 * justice + 50 * attack
  return Math.floor((point * SCORE_DENOMINATOR) / notes)
}

/**
 * 下位判定数からJUSTICE CRITICAL基準の失点を計算する。
 *
 * @param justice - JUSTICE数。
 * @param attack - ATTACK数。
 * @param miss - MISS数。
 * @returns 合計失点。
 */
const calculateLoss = (justice: number, attack: number, miss: number): number =>
  JUSTICE_LOSS * justice + ATTACK_LOSS * attack + MISS_LOSS * miss

/**
 * 代表的な許容JUSTICE / ATTACK / MISS数を計算する。
 *
 * @param input - ボーダー計算の入力値。
 * @param lossBudget - 目標スコアに対する許容失点。
 * @returns 通常表示用の1行結果。
 */
const calculateSummaryBorder = (
  input: BorderCalculatorInput,
  lossBudget: number
): Extract<BorderCalculatorResult, { mode: 'summary'; reachable: true }> => {
  const miss = input.fullComboOnly ? 0 : Math.min(Math.floor(lossBudget / MISS_LOSS), input.notes)
  const remainingAfterMiss = lossBudget - MISS_LOSS * miss
  const attack = Math.min(Math.floor(remainingAfterMiss / ATTACK_LOSS), input.notes - miss)
  const remainingAfterAttack = remainingAfterMiss - ATTACK_LOSS * attack
  const justice = Math.min(remainingAfterAttack, input.notes - miss - attack)

  return {
    mode: 'summary',
    reachable: true,
    justice,
    attack,
    miss,
    lossBudget,
    score: calculateBorderScore(input.notes, justice, attack, miss),
  }
}

/**
 * 目標JUSTICE数を基準にMISS数ごとの候補一覧を計算する。
 *
 * @param input - 目標JUSTICE数を含むボーダー計算の入力値。
 * @param lossBudget - 目標スコアに対する許容失点。
 * @returns 候補一覧表示用の結果。
 */
const calculateCandidateBorders = (
  input: BorderCalculatorInput & { targetJustice: number },
  lossBudget: number
): Extract<BorderCalculatorResult, { mode: 'candidates'; reachable: true }> => {
  const maxMiss = input.fullComboOnly
    ? 0
    : Math.min(Math.floor(lossBudget / MISS_LOSS), input.notes)
  const candidates: BorderCalculatorRow[] = []

  for (let miss = maxMiss; miss >= 0; miss -= 1) {
    const remaining = lossBudget - MISS_LOSS * miss
    const maxAttackByJustice = Math.floor((remaining - (input.targetJustice + 1)) / ATTACK_LOSS)
    const maxAttackByNotes = input.notes - miss
    const attack = Math.min(maxAttackByJustice, maxAttackByNotes)
    const minAttackByNotes = Math.max(0, ceilDiv(Math.max(0, remaining + miss - input.notes), 50))

    if (attack < 0 || attack < minAttackByNotes) continue

    const justice = remaining - ATTACK_LOSS * attack
    const loss = calculateLoss(justice, attack, miss)
    const score = calculateBorderScore(input.notes, justice, attack, miss)

    if (
      justice > input.targetJustice &&
      loss <= lossBudget &&
      justice + attack + miss <= input.notes &&
      score >= input.targetScore
    ) {
      candidates.push({ justice, attack, miss, loss, score })
    }
  }

  return {
    mode: 'candidates',
    reachable: true,
    lossBudget,
    candidates,
  }
}

/**
 * CHUNITHMの目標スコアに対する許容判定数を計算する。
 *
 * @param input - ノーツ数、目標スコア、任意の目標JUSTICE数とFULL COMBO指定。
 * @returns 通常結果、候補一覧、または到達不能結果。
 */
export const calculateBorder = (input: BorderCalculatorInput): BorderCalculatorResult => {
  assertValidBorderInput(input)

  const mode = input.targetJustice === undefined ? 'summary' : 'candidates'
  const lossBudget = calculateLossBudget(input.notes, input.targetScore)

  if (lossBudget < 0) {
    return {
      mode,
      reachable: false,
      lossBudget,
      score: 0,
    }
  }

  if (input.targetJustice !== undefined) {
    return calculateCandidateBorders({ ...input, targetJustice: input.targetJustice }, lossBudget)
  }

  return calculateSummaryBorder(input, lossBudget)
}
