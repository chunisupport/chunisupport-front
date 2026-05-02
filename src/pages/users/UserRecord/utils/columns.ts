import {
  createGridTemplateColumns,
  getRecordColumnBaseDefinition,
} from '../../utils/recordColumnDefinitions.ts'
import type { RecordColumnId, RecordSortKey } from '../types/types'

export type RecordColumnDefinition = {
  id: RecordColumnId
  label: string
  width: string
  sortKey: RecordSortKey
  defaultVisible: boolean
  align?: 'start' | 'center'
}

type RecordColumnSetting = {
  id: RecordColumnId
  defaultVisible: boolean
}

const RECORD_COLUMN_SETTINGS: RecordColumnSetting[] = [
  { id: 'title', defaultVisible: true },
  { id: 'difficulty', defaultVisible: true },
  { id: 'const', defaultVisible: true },
  { id: 'score', defaultVisible: true },
  { id: 'rating', defaultVisible: true },
  { id: 'lamp', defaultVisible: true },
  { id: 'justiceCount', defaultVisible: true },
  { id: 'updatedAt', defaultVisible: true },
]

export const RECORD_COLUMN_DEFINITIONS: RecordColumnDefinition[] = RECORD_COLUMN_SETTINGS.map(
  (setting) => {
    const baseDefinition = getRecordColumnBaseDefinition(setting.id)

    return {
      ...baseDefinition,
      id: setting.id,
      sortKey: baseDefinition.sortKey as RecordSortKey,
      defaultVisible: setting.defaultVisible,
    }
  }
)

const RECORD_COLUMN_IDS = new Set<RecordColumnId>(
  RECORD_COLUMN_DEFINITIONS.map((column) => column.id)
)

const COLUMN_BY_ID = new Map<RecordColumnId, RecordColumnDefinition>(
  RECORD_COLUMN_DEFINITIONS.map((column) => [column.id, column])
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
  return visibleColumnIds
    .map((columnId) => COLUMN_BY_ID.get(columnId))
    .filter((column): column is RecordColumnDefinition => column !== undefined)
}

export { createGridTemplateColumns }
