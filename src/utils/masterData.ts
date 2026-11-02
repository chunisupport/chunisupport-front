import type { MasterItemDTO } from '../types/api'
import type { SortDirection } from './sortingQuery'

const jaCollator = new Intl.Collator('ja')

const getSortOrder = (item: MasterItemDTO): number =>
  typeof item.sort_order === 'number' ? item.sort_order : Number.MAX_SAFE_INTEGER

export const sortMasterItemsBySortOrder = <T extends MasterItemDTO>(items: readonly T[]): T[] =>
  items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const orderDiff = getSortOrder(left.item) - getSortOrder(right.item)
      if (orderDiff !== 0) return orderDiff

      if (left.item.id !== right.item.id) return left.item.id - right.item.id

      const nameDiff = jaCollator.compare(left.item.name, right.item.name)
      if (nameDiff !== 0) return nameDiff

      return left.index - right.index
    })
    .map(({ item }) => item)

export const createMasterItemOrderMap = (
  items: readonly MasterItemDTO[] | undefined
): Map<string, number> =>
  new Map(sortMasterItemsBySortOrder(items ?? []).map((item, index) => [item.name, index]))

export const compareMasterItemNames = (
  left: string,
  right: string,
  orderMap: Map<string, number> | undefined
): number => {
  const leftOrder = orderMap?.get(left) ?? Number.MAX_SAFE_INTEGER
  const rightOrder = orderMap?.get(right) ?? Number.MAX_SAFE_INTEGER
  if (leftOrder !== rightOrder) return leftOrder - rightOrder

  return jaCollator.compare(left, right)
}

/**
 * マスタ順で比較し、マスタにない項目は昇順・降順とも末尾へ固定する。
 *
 * `compareMasterItemNames` の結果へ方向係数を掛けると、降順でマスタ外項目が
 * 先頭へ反転するため、マスタ外判定だけは方向係数を適用しない。
 *
 * @param left - 比較する左側の項目名。
 * @param right - 比較する右側の項目名。
 * @param orderMap - マスタ項目名から表示順へのマップ。
 * @param direction - 昇順または降順。
 * @returns 左側を先に並べる場合は負数、右側を先に並べる場合は正数、同順の場合は0。
 */
export const compareMasterItemNamesKeepingUnknownLast = (
  left: string,
  right: string,
  orderMap: Map<string, number> | undefined,
  direction: SortDirection
): number => {
  const leftUnknown = !orderMap?.has(left)
  const rightUnknown = !orderMap?.has(right)

  if (leftUnknown !== rightUnknown) {
    return leftUnknown ? 1 : -1
  }

  return compareMasterItemNames(left, right, orderMap) * (direction === 'asc' ? 1 : -1)
}
