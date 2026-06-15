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

type WorldsendRecordColumnId =
  | 'title'
  | 'attribute'
  | 'level'
  | 'score'
  | 'lamp'
  | 'hardLamp'
  | 'fullChain'
  | 'justiceCount'
  | 'updatedAt'
type WorldsendRecordSortKey = WorldsendRecordColumnId

type WorldsendRecordColumnDefinition = {
  id: WorldsendRecordColumnId
  label: string
  width: string
  sortKey: WorldsendRecordSortKey
  defaultVisible: boolean
  align?: 'start' | 'center'
}

type WorldsendRecordColumnSetting = {
  id: WorldsendRecordColumnId
  defaultVisible: boolean
}

const WORLDSEND_RECORD_COLUMN_SETTINGS: WorldsendRecordColumnSetting[] = [
  { id: 'title', defaultVisible: true },
  { id: 'attribute', defaultVisible: true },
  { id: 'level', defaultVisible: true },
  { id: 'score', defaultVisible: true },
  { id: 'lamp', defaultVisible: true },
  { id: 'hardLamp', defaultVisible: true },
  { id: 'fullChain', defaultVisible: false },
  { id: 'justiceCount', defaultVisible: true },
  { id: 'updatedAt', defaultVisible: true },
]

export const WORLDSEND_RECORD_COLUMN_DEFINITIONS: WorldsendRecordColumnDefinition[] =
  WORLDSEND_RECORD_COLUMN_SETTINGS.map((setting) => {
    const baseDefinition = getRecordColumnBaseDefinition(setting.id)

    return {
      ...baseDefinition,
      id: setting.id,
      sortKey: baseDefinition.sortKey as WorldsendRecordSortKey,
      defaultVisible: setting.defaultVisible,
    }
  })

export const getDefaultVisibleWorldsendColumnIds = (): WorldsendRecordColumnId[] =>
  getDefaultVisibleColumnIdsFromDefinitions(WORLDSEND_RECORD_COLUMN_DEFINITIONS)

export const sanitizeVisibleWorldsendColumnIds = (
  visibleColumnIds: WorldsendRecordColumnId[] | null | undefined
): WorldsendRecordColumnId[] =>
  sanitizeVisibleColumnIdsFromDefinitions(WORLDSEND_RECORD_COLUMN_DEFINITIONS, visibleColumnIds)

export const sortVisibleWorldsendColumnIdsByDefinitionOrder = (
  visibleColumnIds: WorldsendRecordColumnId[]
): WorldsendRecordColumnId[] =>
  sortVisibleColumnIdsByDefinitionOrderFromDefinitions(
    WORLDSEND_RECORD_COLUMN_DEFINITIONS,
    visibleColumnIds
  )

export const getVisibleWorldsendColumns = (
  visibleColumnIds: WorldsendRecordColumnId[]
): WorldsendRecordColumnDefinition[] =>
  getVisibleColumnsFromDefinitions(WORLDSEND_RECORD_COLUMN_DEFINITIONS, visibleColumnIds)

export type { WorldsendRecordColumnDefinition, WorldsendRecordColumnId, WorldsendRecordSortKey }

export { createGridTemplateColumns }

export const worldsendGridColumns = createGridTemplateColumns(
  WORLDSEND_RECORD_COLUMN_DEFINITIONS.filter((c) => c.defaultVisible)
)
