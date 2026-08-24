import type { RecordColumnId, RecordSortKey } from '../../../../types/recordFilter'
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

/** 通常譜面のレベル列へ適用するレート列と同じ幅 */
const STANDARD_RECORD_LEVEL_COLUMN_WIDTH = getRecordColumnBaseDefinition('rating').width

const RECORD_COLUMN_SETTINGS: RecordColumnSetting[] = [
  { id: 'title', defaultVisible: true },
  { id: 'difficulty', defaultVisible: true },
  { id: 'level', defaultVisible: false },
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
      width: setting.id === 'level' ? STANDARD_RECORD_LEVEL_COLUMN_WIDTH : baseDefinition.width,
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
