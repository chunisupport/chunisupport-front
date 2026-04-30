import {
  createGridTemplateColumns,
  getRecordColumnBaseDefinition,
} from '../../utils/recordColumnDefinitions.ts'

type WorldsendRecordColumnId = 'title' | 'attribute' | 'level' | 'score' | 'lamp' | 'updatedAt'
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

export const worldsendGridColumns = createGridTemplateColumns(WORLDSEND_RECORD_COLUMN_DEFINITIONS)
