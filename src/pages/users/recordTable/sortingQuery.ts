export type SortDirection = 'asc' | 'desc'

type SortParamsSource = Record<string, string | string[] | undefined>

const readFirstParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '')

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

export const sanitizeSortQuery = (
  searchParams: SortParamsSource,
  setSearchParams: (
    params: { sortcol: undefined; sortorder: undefined },
    options: { replace: true }
  ) => void
): void => {
  if (searchParams.sortcol !== undefined || searchParams.sortorder !== undefined) {
    setSearchParams({ sortcol: undefined, sortorder: undefined }, { replace: true })
  }
}
