export type SortDirection = 'asc' | 'desc' | null

/**
 * aria-sort用の値へソート状態を変換する。
 *
 * @param active - 対象列が現在ソート対象かどうか。
 * @param direction - 現在のソート方向。
 * @returns aria-sortへ渡すソート状態。
 */
export const getSortAriaValue = (
  active: boolean,
  direction: SortDirection
): 'ascending' | 'descending' | 'none' => {
  if (!active || !direction) return 'none'
  return direction === 'asc' ? 'ascending' : 'descending'
}
