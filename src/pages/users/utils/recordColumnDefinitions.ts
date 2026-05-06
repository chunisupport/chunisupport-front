export type RecordColumnBaseId =
  | 'title'
  | 'difficulty'
  | 'const'
  | 'score'
  | 'rating'
  | 'lamp'
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
    label: '曲名',
    width: 'minmax(11.25rem,1fr)',
    sortKey: 'title',
    align: 'start',
  },
  difficulty: { id: 'difficulty', label: '難易度', width: '2.5rem', sortKey: 'difficulty' },
  const: { id: 'const', label: '定数', width: '2.5rem', sortKey: 'const' },
  score: { id: 'score', label: 'スコア', width: '4.4rem', sortKey: 'score' },
  rating: { id: 'rating', label: 'レート', width: '3.2rem', sortKey: 'rating' },
  lamp: { id: 'lamp', label: 'AJ', width: '2.5rem', sortKey: 'lamp' },
  justiceCount: { id: 'justiceCount', label: 'J数', width: '2rem', sortKey: 'justiceCount' },
  overpower: { id: 'overpower', label: 'OP', width: '3rem', sortKey: 'overpower' },
  overpowerPercent: {
    id: 'overpowerPercent',
    label: 'OP%',
    width: '3rem',
    sortKey: 'overpowerPercent',
  },
  updatedAt: { id: 'updatedAt', label: '更新日', width: '4rem', sortKey: 'updatedAt' },
  attribute: { id: 'attribute', label: '属性', width: '2.5rem', sortKey: 'attribute' },
  level: { id: 'level', label: 'レベル', width: '3.1rem', sortKey: 'level' },
}

export const getRecordColumnBaseDefinition = (
  columnId: RecordColumnBaseId
): RecordColumnBaseDefinition => RECORD_COLUMN_BASE_DEFINITIONS[columnId]

export const createGridTemplateColumns = (columns: readonly { width: string }[]): string =>
  columns.map((column) => column.width).join(' ')
