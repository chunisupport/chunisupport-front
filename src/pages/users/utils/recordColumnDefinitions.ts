import { localizedCopy } from '../../../i18n'

/** レコード表の列名 */
const RECORD_COLUMN_TEXT = localizedCopy('users.columns')
export type RecordColumnBaseId =
  | 'title'
  | 'difficulty'
  | 'const'
  | 'score'
  | 'rating'
  | 'lamp'
  | 'hardLamp'
  | 'fullChain'
  | 'justiceCount'
  | 'overpower'
  | 'overpowerPercent'
  | 'updatedAt'
  | 'attribute'
  | 'level'

export type RecordColumnBaseDefinition = {
  id: RecordColumnBaseId
  label: string
  width: string
  sortKey: string
  align?: 'start' | 'center'
}

export const RECORD_COLUMN_BASE_DEFINITIONS: Record<
  RecordColumnBaseId,
  RecordColumnBaseDefinition
> = {
  title: {
    id: 'title',
    label: RECORD_COLUMN_TEXT.title,
    width: 'minmax(11.25rem,1fr)',
    sortKey: 'title',
    align: 'start',
  },
  difficulty: { id: 'difficulty', label: RECORD_COLUMN_TEXT.difficulty, width: '2.5rem', sortKey: 'difficulty' },
  const: { id: 'const', label: RECORD_COLUMN_TEXT.const, width: '2.5rem', sortKey: 'const' },
  score: { id: 'score', label: RECORD_COLUMN_TEXT.score, width: '4.4rem', sortKey: 'score' },
  rating: { id: 'rating', label: RECORD_COLUMN_TEXT.rating, width: '40px', sortKey: 'rating' },
  lamp: { id: 'lamp', label: 'AJ', width: '40px', sortKey: 'lamp' },
  hardLamp: { id: 'hardLamp', label: RECORD_COLUMN_TEXT.hardLamp, width: '40px', sortKey: 'hardLamp' },
  fullChain: { id: 'fullChain', label: 'FCH', width: '40px', sortKey: 'fullChain' },
  justiceCount: { id: 'justiceCount', label: RECORD_COLUMN_TEXT.justiceCount, width: '2rem', sortKey: 'justiceCount' },
  overpower: { id: 'overpower', label: 'OP', width: '3rem', sortKey: 'overpower' },
  overpowerPercent: {
    id: 'overpowerPercent',
    label: 'OP%',
    width: '3rem',
    sortKey: 'overpowerPercent',
  },
  updatedAt: { id: 'updatedAt', label: RECORD_COLUMN_TEXT.updatedAt, width: '4rem', sortKey: 'updatedAt' },
  attribute: { id: 'attribute', label: RECORD_COLUMN_TEXT.attribute, width: '2.5rem', sortKey: 'attribute' },
  level: { id: 'level', label: RECORD_COLUMN_TEXT.level, width: '3.1rem', sortKey: 'level' },
}

export const getRecordColumnBaseDefinition = (
  columnId: RecordColumnBaseId
): RecordColumnBaseDefinition => RECORD_COLUMN_BASE_DEFINITIONS[columnId]

export const createGridTemplateColumns = (columns: readonly { width: string }[]): string =>
  columns.map((column) => column.width).join(' ')
