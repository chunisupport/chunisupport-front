import {
  createGridTemplateColumns,
  getRecordColumnBaseDefinition,
} from '../../utils/recordColumnDefinitions.ts'
import {
  getDefaultVisibleColumnIds as getDefaultVisibleColumnIdsFromDefinitions,
  getVisibleColumns as getVisibleColumnsFromDefinitions,
  sanitizeVisibleColumnIds as sanitizeVisibleColumnIdsFromDefinitions,
  sortVisibleColumnIdsByDefinitionOrder as sortVisibleColumnIdsByDefinitionOrderFromDefinitions,
} from '../../utils/recordTableColumns'
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
  { id: 'hardLamp', defaultVisible: true },
  { id: 'fullChain', defaultVisible: false },
  { id: 'justiceCount', defaultVisible: true },
  { id: 'overpower', defaultVisible: false },
  { id: 'overpowerPercent', defaultVisible: false },
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

export const getDefaultVisibleColumnIds = (): RecordColumnId[] =>
  getDefaultVisibleColumnIdsFromDefinitions(RECORD_COLUMN_DEFINITIONS)

export const sanitizeVisibleColumnIds = (
  visibleColumnIds: RecordColumnId[] | null | undefined
): RecordColumnId[] =>
  sanitizeVisibleColumnIdsFromDefinitions(RECORD_COLUMN_DEFINITIONS, visibleColumnIds)

export const getVisibleColumns = (visibleColumnIds: RecordColumnId[]): RecordColumnDefinition[] =>
  getVisibleColumnsFromDefinitions(RECORD_COLUMN_DEFINITIONS, visibleColumnIds)

export const sortVisibleColumnIdsByDefinitionOrder = (
  visibleColumnIds: RecordColumnId[]
): RecordColumnId[] =>
  sortVisibleColumnIdsByDefinitionOrderFromDefinitions(RECORD_COLUMN_DEFINITIONS, visibleColumnIds)

export { createGridTemplateColumns }
