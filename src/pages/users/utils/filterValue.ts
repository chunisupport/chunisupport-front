export {
  clampNumber,
  type OptionalRangeInputOptions,
  parseNumberInput,
  parseOptionalRangeNumberInput,
  sanitizeRangeInput,
  toInputValue,
  updateOptionalNumberRange,
} from '../../../utils/rangeInput'

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
