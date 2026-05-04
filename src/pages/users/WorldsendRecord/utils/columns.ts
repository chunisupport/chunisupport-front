import {
  createGridTemplateColumns,
  getRecordColumnBaseDefinition,
} from '../../utils/recordColumnDefinitions.ts'

type WorldsendRecordColumnId =
  | 'title'
  | 'attribute'
  | 'level'
  | 'score'
  | 'lamp'
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

const WORLDSEND_COLUMN_IDS = new Set<WorldsendRecordColumnId>(
  WORLDSEND_RECORD_COLUMN_DEFINITIONS.map((column) => column.id)
)

const WORLDSEND_COLUMN_BY_ID = new Map<WorldsendRecordColumnId, WorldsendRecordColumnDefinition>(
  WORLDSEND_RECORD_COLUMN_DEFINITIONS.map((column) => [column.id, column])
)

const WORLDSEND_COLUMN_ORDER = new Map<WorldsendRecordColumnId, number>(
  WORLDSEND_RECORD_COLUMN_DEFINITIONS.map((column, index) => [column.id, index])
)

export const getDefaultVisibleWorldsendColumnIds = (): WorldsendRecordColumnId[] =>
  WORLDSEND_RECORD_COLUMN_DEFINITIONS.filter((column) => column.defaultVisible).map(
    (column) => column.id
  )

export const sanitizeVisibleWorldsendColumnIds = (
  visibleColumnIds: WorldsendRecordColumnId[] | null | undefined
): WorldsendRecordColumnId[] => {
  const defaults = getDefaultVisibleWorldsendColumnIds()
  if (!visibleColumnIds || visibleColumnIds.length === 0) {
    return defaults
  }

  const uniqueVisibleColumnIds = Array.from(new Set(visibleColumnIds)).filter((columnId) =>
    WORLDSEND_COLUMN_IDS.has(columnId)
  )

  if (uniqueVisibleColumnIds.length === 0) {
    return defaults
  }

  return uniqueVisibleColumnIds
}

export const sortVisibleWorldsendColumnIdsByDefinitionOrder = (
  visibleColumnIds: WorldsendRecordColumnId[]
): WorldsendRecordColumnId[] => {
  return [...visibleColumnIds].sort(
    (a, b) => (WORLDSEND_COLUMN_ORDER.get(a) ?? 0) - (WORLDSEND_COLUMN_ORDER.get(b) ?? 0)
  )
}

export const getVisibleWorldsendColumns = (
  visibleColumnIds: WorldsendRecordColumnId[]
): WorldsendRecordColumnDefinition[] => {
  return visibleColumnIds
    .map((columnId) => WORLDSEND_COLUMN_BY_ID.get(columnId))
    .filter((column): column is WorldsendRecordColumnDefinition => column !== undefined)
}

export type { WorldsendRecordColumnDefinition, WorldsendRecordColumnId, WorldsendRecordSortKey }

export { createGridTemplateColumns }

export const worldsendGridColumns = createGridTemplateColumns(
  WORLDSEND_RECORD_COLUMN_DEFINITIONS.filter((c) => c.defaultVisible)
)
