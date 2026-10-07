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

/**
 * null を全選択として扱う2つのフィルター値が同じ条件か判定する。
 *
 * @param left - 比較元のフィルター値。null は全選択を表す。
 * @param right - 比較先のフィルター値。null は全選択を表す。
 * @returns 両方 null、または同じ値集合の場合は true。
 */
export function hasSameNullableFilterValues<T>(left: T[] | null, right: T[] | null): boolean {
  if (left === null || right === null) return left === right
  return hasSameFilterValues(left, right)
}

/**
 * null を全選択として扱うフィルター値を、複数選択UIに表示する選択状態へ変換する。
 *
 * @param selected - フィルターに保存された選択値。null は全選択を表す。
 * @param allValues - 選択可能なすべての値。
 * @returns 複数選択UIに表示する選択値。
 */
export function toNullableAllDisplaySelection<T>(selected: T[] | null, allValues: T[]): T[] {
  return selected ?? [...allValues]
}

/**
 * 複数選択UIの選択状態を、全選択を null で表すフィルター値へ変換する。
 *
 * @param selected - 複数選択UIで選択された値。
 * @param allValues - 選択可能なすべての値。
 * @returns 全選択なら null、それ以外は選択値。
 */
export function toNullableAllFilterSelection<T>(selected: T[], allValues: T[]): T[] | null {
  return allValues.length > 0 && hasSameFilterValues(selected, allValues) ? null : selected
}
