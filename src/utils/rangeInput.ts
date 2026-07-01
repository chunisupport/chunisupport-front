import type { NumericRangeFilter } from '../types/record'

const DECIMAL_BASE = 10

export type OptionalRangeInputOptions = {
  /** 許可する最小値。 */
  min: number
  /** 許可する最大値。 */
  max: number
  /** 整数のみ許可するか。 */
  integer?: boolean
  /** 正規化後に揃える小数点以下桁数。 */
  decimalPlaces?: number
}

/**
 * 数値を入力欄用の文字列へ変換する。
 *
 * @param value - 入力欄へ表示する数値。未指定の場合は空文字へ変換する。
 * @returns 入力欄へ渡す文字列。
 */
export const toInputValue = (value?: number | null): string =>
  value === undefined || value === null ? '' : String(value)

/**
 * 数値を許可範囲内へ丸め込む。
 *
 * @param value - 正規化する数値。
 * @param min - 許可する最小値。
 * @param max - 許可する最大値。
 * @returns 許可範囲内に収まる数値。
 */
export const clampNumber = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max))

/**
 * 範囲入力欄へ入力できる文字だけを残す。
 *
 * @param value - 入力欄から受け取った文字列。
 * @param allowedInput - 許可する1文字を表す正規表現。
 * @returns 許可文字だけで構成された入力値。
 */
export const sanitizeRangeInput = (value: string, allowedInput: RegExp): string =>
  Array.from(value)
    .filter((char) => {
      allowedInput.lastIndex = 0
      return allowedInput.test(char)
    })
    .join('')

/**
 * 数値入力欄の文字列を数値へ変換する。
 *
 * @param value - 入力欄から受け取った文字列。
 * @returns 確定した数値。空欄や未確定の小数はundefined。
 */
export function parseNumberInput(value: string): number | undefined {
  if (value === '' || value === '.') return undefined
  if (/^\.\d+$/.test(value)) return parseFloat(`0${value}`)
  if (/^\d+\.$/.test(value)) return undefined
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

/**
 * 数値を範囲入力用の小数桁数へ正規化する。
 *
 * @param value - 正規化する数値。
 * @param min - 許可する最小値。
 * @param max - 許可する最大値。
 * @param decimalPlaces - 小数点以下桁数。
 * @returns 小数桁数と許可範囲を反映した数値。
 */
const normalizeRangeDecimalPlaces = (
  value: number,
  min: number,
  max: number,
  decimalPlaces: number
): number => {
  const factor = DECIMAL_BASE ** decimalPlaces
  const normalized = Math.round(value * factor) / factor
  return clampNumber(normalized, min, max)
}

/**
 * 空欄を許す範囲入力値をフィルター用の数値へ正規化する。
 *
 * @param value - 入力欄から受け取った文字列。
 * @param options - 許可範囲、整数指定、小数桁数の設定。
 * @returns 正規化済みの数値。空欄または不正値の場合はnull。
 */
export function parseOptionalRangeNumberInput(
  value: string,
  options: OptionalRangeInputOptions
): number | null {
  const parsed = parseNumberInput(value)
  if (parsed === undefined) return null
  if (options.integer && !Number.isInteger(parsed)) return null
  if (!Number.isFinite(parsed)) return null

  const normalized = clampNumber(parsed, options.min, options.max)
  if (typeof options.decimalPlaces === 'number') {
    return normalizeRangeDecimalPlaces(normalized, options.min, options.max, options.decimalPlaces)
  }

  return normalized
}

/**
 * 範囲の片側入力を更新した次の範囲値を返す。
 *
 * @param current - 現在の範囲値。
 * @param key - 更新対象の範囲端。
 * @param value - 入力欄から受け取った文字列。
 * @param options - 許可範囲、整数指定、小数桁数の設定。
 * @returns 更新後の範囲値。
 */
export function updateOptionalNumberRange(
  current: NumericRangeFilter<number | null>,
  key: keyof NumericRangeFilter<number | null>,
  value: string,
  options: OptionalRangeInputOptions
): NumericRangeFilter<number | null> {
  return {
    ...current,
    [key]: parseOptionalRangeNumberInput(value, options),
  }
}
