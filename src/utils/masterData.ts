import type { MasterItemDTO } from '../types/api'

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
