export type ColumnDefinitionBase<TColumnId extends string, TSortKey extends string> = {
  id: TColumnId
  label: string
  width: string
  sortKey: TSortKey
  defaultVisible: boolean
  align?: 'start' | 'center'
}

export const getDefaultVisibleColumnIds = <TColumnId extends string, TSortKey extends string>(
  columns: ColumnDefinitionBase<TColumnId, TSortKey>[]
): TColumnId[] => columns.filter((column) => column.defaultVisible).map((column) => column.id)

export const sanitizeVisibleColumnIds = <TColumnId extends string, TSortKey extends string>(
  columns: ColumnDefinitionBase<TColumnId, TSortKey>[],
  visibleColumnIds: TColumnId[] | null | undefined
): TColumnId[] => {
  const defaults = getDefaultVisibleColumnIds(columns)
  if (!visibleColumnIds || visibleColumnIds.length === 0) {
    return defaults
  }

  const columnIds = new Set(columns.map((column) => column.id))
  const uniqueVisibleColumnIds = Array.from(new Set(visibleColumnIds)).filter((columnId) =>
    columnIds.has(columnId)
  )

  if (uniqueVisibleColumnIds.length === 0) {
    return defaults
  }

  return uniqueVisibleColumnIds
}

export const sortVisibleColumnIdsByDefinitionOrder = <
  TColumnId extends string,
  TSortKey extends string,
>(
  columns: ColumnDefinitionBase<TColumnId, TSortKey>[],
  visibleColumnIds: TColumnId[]
): TColumnId[] => {
  const columnOrder = new Map(columns.map((column, index) => [column.id, index]))

  return [...visibleColumnIds].sort((a, b) => (columnOrder.get(a) ?? 0) - (columnOrder.get(b) ?? 0))
}

export const getVisibleColumns = <TColumnId extends string, TSortKey extends string>(
  columns: ColumnDefinitionBase<TColumnId, TSortKey>[],
  visibleColumnIds: TColumnId[]
): ColumnDefinitionBase<TColumnId, TSortKey>[] => {
  const columnById = new Map(columns.map((column) => [column.id, column]))

  return visibleColumnIds
    .map((columnId) => columnById.get(columnId))
    .filter((column): column is ColumnDefinitionBase<TColumnId, TSortKey> => column !== undefined)
}
