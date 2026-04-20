import type { RecordColumnId, RecordSortKey } from '../types/types'

export type RecordColumnDefinition = {
  id: RecordColumnId
  label: string
  width: string
  sortKey: RecordSortKey
  defaultVisible: boolean
  align?: 'start' | 'center'
}

export const RECORD_COLUMN_DEFINITIONS: RecordColumnDefinition[] = [
  {
    id: 'title',
    label: '曲名',
    width: 'minmax(11.25rem,1fr)',
    sortKey: 'title',
    defaultVisible: true,
    align: 'start',
  },
  { id: 'difficulty', label: '難', width: '2.5rem', sortKey: 'difficulty', defaultVisible: true },
  { id: 'const', label: '定数', width: '3.1rem', sortKey: 'const', defaultVisible: true },
  { id: 'score', label: 'スコア', width: '3.6rem', sortKey: 'score', defaultVisible: true },
  { id: 'rating', label: 'レート', width: '3.6rem', sortKey: 'rating', defaultVisible: true },
  { id: 'lamp', label: 'AJ', width: '3.5rem', sortKey: 'lamp', defaultVisible: true },
  { id: 'updatedAt', label: '更新日', width: '3.5rem', sortKey: 'updatedAt', defaultVisible: true },
]

const RECORD_COLUMN_IDS = new Set<RecordColumnId>(
  RECORD_COLUMN_DEFINITIONS.map((column) => column.id)
)

export const getDefaultVisibleColumnIds = (): RecordColumnId[] =>
  RECORD_COLUMN_DEFINITIONS.filter((column) => column.defaultVisible).map((column) => column.id)

export const sanitizeVisibleColumnIds = (
  visibleColumnIds: RecordColumnId[] | null | undefined
): RecordColumnId[] => {
  const defaults = getDefaultVisibleColumnIds()
  if (!visibleColumnIds || visibleColumnIds.length === 0) {
    return defaults
  }

  const uniqueVisibleColumnIds = Array.from(new Set(visibleColumnIds)).filter((columnId) =>
    RECORD_COLUMN_IDS.has(columnId)
  )

  if (uniqueVisibleColumnIds.length === 0) {
    return defaults
  }

  return uniqueVisibleColumnIds
}

export const getVisibleColumns = (visibleColumnIds: RecordColumnId[]): RecordColumnDefinition[] => {
  const columnById = new Map(RECORD_COLUMN_DEFINITIONS.map((column) => [column.id, column]))
  return visibleColumnIds
    .map((columnId) => columnById.get(columnId))
    .filter((column): column is RecordColumnDefinition => column !== undefined)
}

export const createGridTemplateColumns = (columns: RecordColumnDefinition[]): string =>
  columns.map((column) => column.width).join(' ')
