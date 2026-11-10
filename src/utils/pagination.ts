/** ページ番号ボタン、または省略記号 */
export type PaginationItem =
  | { type: 'page'; page: number }
  | { type: 'ellipsis'; key: 'start' | 'end' }

const DEFAULT_SIBLING_COUNT = 1

/**
 * 連続するページ番号の配列を生成する。
 *
 * @param start - 開始ページ番号（含む）。
 * @param end - 終了ページ番号（含む）。
 * @returns start から end までの整数配列。
 */
const createPageRange = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index)

/**
 * 総件数または現在ページの件数から総ページ数を求める。
 * 総件数が無い場合は、満件なら次ページがあるものとして扱う。
 *
 * @param options.currentPage - 現在のページ番号（1始まり）。
 * @param options.pageSize - 1ページあたりの件数。
 * @param options.itemCount - 現在ページの件数。
 * @param options.totalCount - 検索条件に対する総件数。未指定なら件数から推定する。
 * @returns 1以上の総ページ数。
 */
export const resolvePagedListTotalPages = (options: {
  currentPage: number
  pageSize: number
  itemCount: number
  totalCount?: number
}): number => {
  const currentPage = Math.max(1, options.currentPage)
  const pageSize = Math.max(1, options.pageSize)
  const itemCount = Math.max(0, options.itemCount)

  if (typeof options.totalCount === 'number') {
    if (options.totalCount <= 0) return 1
    return Math.ceil(options.totalCount / pageSize)
  }

  if (itemCount === 0 || itemCount < pageSize) return currentPage
  return currentPage + 1
}

/**
 * 先頭・末尾・現在ページ付近の番号と省略記号を並べたページネーション項目を返す。
 *
 * @param currentPage - 現在のページ番号（1始まり）。
 * @param totalPages - 総ページ数。
 * @param siblingCount - 現在ページの左右に出す番号数。省略時は1。
 * @returns 表示するページ番号と省略記号の配列。
 */
export const buildPaginationItems = (
  currentPage: number,
  totalPages: number,
  siblingCount = DEFAULT_SIBLING_COUNT
): PaginationItem[] => {
  const safeTotalPages = Math.max(1, totalPages)
  const safeCurrentPage = Math.min(safeTotalPages, Math.max(1, currentPage))
  const safeSiblingCount = Math.max(0, siblingCount)
  const maxVisiblePages = safeSiblingCount * 2 + 5

  const toPageItems = (pages: number[]): PaginationItem[] =>
    pages.map((page) => ({ type: 'page', page }))

  if (safeTotalPages <= maxVisiblePages) {
    return toPageItems(createPageRange(1, safeTotalPages))
  }

  const leftSibling = Math.max(safeCurrentPage - safeSiblingCount, 1)
  const rightSibling = Math.min(safeCurrentPage + safeSiblingCount, safeTotalPages)
  const showStartEllipsis = leftSibling > 2
  const showEndEllipsis = rightSibling < safeTotalPages - 1

  if (!showStartEllipsis && showEndEllipsis) {
    const leadingCount = 3 + 2 * safeSiblingCount
    return [
      ...toPageItems(createPageRange(1, leadingCount)),
      { type: 'ellipsis', key: 'end' },
      { type: 'page', page: safeTotalPages },
    ]
  }

  if (showStartEllipsis && !showEndEllipsis) {
    const trailingCount = 3 + 2 * safeSiblingCount
    return [
      { type: 'page', page: 1 },
      { type: 'ellipsis', key: 'start' },
      ...toPageItems(createPageRange(safeTotalPages - trailingCount + 1, safeTotalPages)),
    ]
  }

  return [
    { type: 'page', page: 1 },
    { type: 'ellipsis', key: 'start' },
    ...toPageItems(createPageRange(leftSibling, rightSibling)),
    { type: 'ellipsis', key: 'end' },
    { type: 'page', page: safeTotalPages },
  ]
}
