export type SortDirection = 'asc' | 'desc'

/** ソートクエリを読み取る検索パラメータの入力元。 */
export type SortParamsSource = Record<string, string | string[] | undefined>

const readFirstParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '')

/**
 * URLクエリからソート列とソート方向を読み取り、画面で使うソート状態へ変換する。
 *
 * @param searchParams - 読み取り対象の検索パラメータ。
 * @param sortColMap - クエリ上の列名から画面内ソートキーへ変換する対応表。
 * @param fallback - クエリが不正な場合に返す既定のソート状態。
 * @returns 検証済みのソートキーとソート方向。
 */
export const parseSortQuery = <TSortKey extends string>(
  searchParams: SortParamsSource,
  sortColMap: Record<string, TSortKey>,
  fallback: { sortKey: TSortKey; sortDirection: SortDirection }
): { sortKey: TSortKey; sortDirection: SortDirection } => {
  const sortcolParam = readFirstParam(searchParams.sortcol)
  const parsedSortKey = sortColMap[sortcolParam] ?? null
  const sortorderParam = readFirstParam(searchParams.sortorder)
  const parsedSortOrder =
    sortorderParam === 'asc' || sortorderParam === 'desc' ? sortorderParam : null

  if (parsedSortKey !== null && parsedSortOrder !== null) {
    return { sortKey: parsedSortKey, sortDirection: parsedSortOrder }
  }

  return fallback
}

/**
 * 列ヘッダークリック時の次の単一ソート状態を算出する。
 *
 * @param currentSortKey - 現在のソートキー。
 * @param currentSortDirection - 現在のソート方向。
 * @param nextKey - 次に操作された列キー。
 * @returns 昇順、降順、解除を循環した次のソート状態。
 */
export const nextSortState = <TSortKey extends string>(
  currentSortKey: TSortKey | null,
  currentSortDirection: SortDirection | null,
  nextKey: TSortKey
): {
  sortKey: TSortKey | null
  sortDirection: SortDirection | null
} => {
  if (currentSortKey !== nextKey) {
    return { sortKey: nextKey, sortDirection: 'asc' }
  }
  if (currentSortDirection === 'asc') {
    return { sortKey: nextKey, sortDirection: 'desc' }
  }
  if (currentSortDirection === 'desc') {
    return { sortKey: null, sortDirection: null }
  }

  return { sortKey: nextKey, sortDirection: 'asc' }
}

type SearchParamValue = string | number | boolean | null | undefined

/**
 * 複数条件ソート移行後に残った旧ソートクエリをURLから取り除く。
 *
 * @param searchParams - 現在の検索パラメータ。
 * @param setSearchParams - URL検索パラメータを更新する関数。
 * @returns 返り値はありません。
 */
export const sanitizeSortQuery = (
  searchParams: SortParamsSource,
  setSearchParams: (
    params: Record<string, SearchParamValue>,
    options?: { replace?: boolean }
  ) => void
): void => {
  if (searchParams.sortcol !== undefined || searchParams.sortorder !== undefined) {
    setSearchParams({ sortcol: undefined, sortorder: undefined }, { replace: true })
  }
}
