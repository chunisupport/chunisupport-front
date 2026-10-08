export {
  hasSameFilterValues,
  hasSameNullableFilterValues,
  toNullableAllDisplaySelection,
  toNullableAllFilterSelection,
} from '../../../utils/filterSelection'
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
 * 配列内の値をトグルした新しい配列を返す。
 *
 * @param arr - 現在の配列。
 * @param value - 追加または削除する値。
 * @returns トグル後の配列。
 */
export function toggleArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}
