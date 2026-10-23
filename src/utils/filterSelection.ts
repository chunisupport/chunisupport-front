/**
 * 2つの配列が順序に依存せず同じ値を持つか判定する。
 *
 * @param left - 比較元の値配列。
 * @param right - 比較先の値配列。
 * @returns 2つの配列が同じ値集合の場合は true。
 */
export function hasSameFilterValues<T>(left: readonly T[], right: readonly T[]): boolean {
  if (left.length !== right.length) return false

  const rightValues = new Set(right)
  return left.every((value) => rightValues.has(value))
}

/**
 * null を全選択として扱う2つのフィルター値が同じ条件か判定する。
 *
 * @param left - 比較元のフィルター値。null は全選択を表す。
 * @param right - 比較先のフィルター値。null は全選択を表す。
 * @returns 両方 null、または同じ値集合の場合は true。
 */
export function hasSameNullableFilterValues<T>(
  left: readonly T[] | null,
  right: readonly T[] | null
): boolean {
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
export function toNullableAllDisplaySelection<T>(
  selected: readonly T[] | null,
  allValues: readonly T[]
): T[] {
  return [...(selected ?? allValues)]
}

/**
 * 複数選択UIの選択状態を、全選択を null で表すフィルター値へ変換する。
 *
 * @param selected - 複数選択UIで選択された値。
 * @param allValues - 選択可能なすべての値。
 * @returns 全選択なら null、それ以外は選択値。
 */
export function toNullableAllFilterSelection<T>(
  selected: readonly T[],
  allValues: readonly T[]
): T[] | null {
  return allValues.length > 0 && hasSameFilterValues(selected, allValues) ? null : [...selected]
}

/**
 * null を全選択として扱うフィルター値に、対象の値が含まれるか判定する。
 *
 * @param value - 判定対象の値。不明な場合は null または undefined。
 * @param selected - フィルター値。null は全選択、空配列は全件不一致を表す。
 * @returns 全選択、または値が選択値に含まれる場合は true。
 */
export function isNullableSelectionMatched<T>(
  value: T | null | undefined,
  selected: readonly T[] | null
): boolean {
  return selected === null || (value !== null && value !== undefined && selected.includes(value))
}

/**
 * バージョンの全選択を未指定（null）へ揃える。
 * 楽曲一覧と同じく、選択肢と一致する選択は未指定として扱う。
 *
 * @param selected - 現在のバージョン選択。null は全選択を表す。
 * @param allVersions - 選択可能な公開済みバージョンの短縮名。
 * @returns 全選択なら null。一部選択と全解除はそのまま返す。
 */
export function normalizeVersionFilterSelection(
  selected: readonly string[] | null,
  allVersions: readonly string[]
): string[] | null {
  if (selected === null) return null
  return toNullableAllFilterSelection(selected, allVersions)
}

/**
 * レコード一覧のバージョン条件に一致するか判定する。
 * null と空配列は未指定で、バージョン不明の楽曲も含めて一致する。
 * 一部のバージョンだけが選ばれている場合は、その短縮名に含まれるときだけ一致する。
 *
 * @param releaseVersion - レコードの収録バージョン。不明な場合は「不明」。
 * @param selected - 選択中のバージョン。null は全選択を表す。
 * @returns バージョン条件に一致する場合は true。
 */
export function matchesRecordVersionFilter(
  releaseVersion: string,
  selected: readonly string[] | null
): boolean {
  return selected === null || selected.length === 0 || selected.includes(releaseVersion)
}

/**
 * 全選択を null で表すバージョン条件に一致するか判定する。
 * null は未指定でバージョン不明も含める。空配列はどのバージョンにも一致しない。
 *
 * @param version - 判定対象のバージョン名。
 * @param selected - 選択中のバージョン。null は全選択を表す。
 * @returns バージョン条件に一致する場合は true。
 */
export function matchesNullableVersionFilter(
  version: string,
  selected: readonly string[] | null
): boolean {
  return selected === null || selected.includes(version)
}
