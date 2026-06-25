/**
 * OVER POWER計算機で扱う基準値。
 */
export type OverPowerCalculatorBase = {
  /** 未解禁曲を除いた理論OVER POWER合計。 */
  max: number
  /** 現在獲得しているOVER POWER合計。 */
  current: number
}

/**
 * 現在値と理論値からOVER POWER達成率を計算する。
 *
 * @param current - 現在獲得しているOVER POWER合計。
 * @param max - 未解禁曲を除いた理論OVER POWER合計。
 * @returns OVER POWER達成率。理論値が0以下の場合は0。
 */
export const calculateOverPowerPercent = (current: number, max: number): number =>
  max > 0 ? (current / max) * 100 : 0

/**
 * 目標達成率から必要OVER POWER値を計算する。
 *
 * @param percent - 目標OVER POWER達成率。
 * @param max - 未解禁曲を除いた理論OVER POWER合計。
 * @returns 目標達成率に必要なOVER POWER値。
 */
export const calculateRequiredOverPower = (percent: number, max: number): number =>
  (max * percent) / 100

/**
 * 目標OVER POWER値と現在値の差分を計算する。
 *
 * @param required - 目標達成に必要なOVER POWER値。
 * @param current - 現在獲得しているOVER POWER合計。
 * @returns 必要値から現在値を引いた差分。
 */
export const calculateOverPowerDifference = (required: number, current: number): number =>
  required - current

/**
 * 入力文字列をOVER POWER計算用の数値へ変換する。
 *
 * @param value - 入力欄の文字列。
 * @returns 空欄または数値化できない場合はnull、それ以外は数値。
 */
export const parseOverPowerInput = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.')
  if (normalized === '') return null

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * OVER POWER値を入力欄向けの文字列へ整形する。
 *
 * @param value - 整形するOVER POWER値。
 * @returns 不要な末尾0を省いた文字列。
 */
export const formatOverPowerInputValue = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
