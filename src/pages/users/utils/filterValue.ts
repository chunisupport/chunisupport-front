import type { NumericRangeFilter } from '../../../types/record'

type OptionalRangeInputOptions = {
  min: number
  max: number
  integer?: boolean
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

  const normalized = Math.max(options.min, Math.min(parsed, options.max))
  if (typeof options.decimalPlaces === 'number') {
    const factor = 10 ** options.decimalPlaces
    const rounded = Math.round(normalized * factor) / factor
    return Math.max(options.min, Math.min(rounded, options.max))
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

/**
 * 2つの配列が順序に依存せず同じ値を持つか判定する。
 *
 * @param left - 比較元の値配列。
 * @param right - 比較先の値配列。
 * @returns 2つの配列が同じ値集合の場合は true。
 */
export function hasSameFilterValues<T>(left: T[], right: T[]): boolean {
  if (left.length !== right.length) return false

  const rightValues = new Set(right)
  return left.every((value) => rightValues.has(value))
}

/**
 * 配列内の値をトグルした新しい配列を返す。
 *
 * @param arr - 現在の配列。
 * @param value - 追加または削除する値。
 * @returns トグル後の配列。
 */
export function toggleArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}
