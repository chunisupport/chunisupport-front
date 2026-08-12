import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createGridTemplateColumns,
  getDefaultVisibleColumnIds,
  getVisibleColumns,
  RECORD_COLUMN_DEFINITIONS,
  sanitizeVisibleColumnIds,
  sortVisibleColumnIdsByDefinitionOrder,
} from './columns.ts'

test('レベル列は難易度と定数の間に配置し、既定では非表示にする', () => {
  // Given: 通常レコードの列定義。
  const columnIds = RECORD_COLUMN_DEFINITIONS.map((column) => column.id)

  // When: レベル列の定義と既定表示列を取得する。
  const levelColumn = RECORD_COLUMN_DEFINITIONS.find((column) => column.id === 'level')
  const defaultColumnIds = getDefaultVisibleColumnIds()

  // Then: レベル列は指定位置とレート列と同じ幅を持ち、既定表示には含まれない。
  assert.equal(columnIds.indexOf('level'), columnIds.indexOf('difficulty') + 1)
  assert.equal(columnIds.indexOf('const'), columnIds.indexOf('level') + 1)
  assert.equal(
    levelColumn?.width,
    RECORD_COLUMN_DEFINITIONS.find((column) => column.id === 'rating')?.width
  )
  assert.equal(defaultColumnIds.includes('level'), false)
})

test('表示カラム未指定時は既定の表示カラムを返す', () => {
  const defaults = getDefaultVisibleColumnIds()
  assert.deepEqual(sanitizeVisibleColumnIds(undefined), defaults)
  assert.deepEqual(sanitizeVisibleColumnIds([]), defaults)
})

test('表示カラムIDは重複排除しつつ不正値を除去する', () => {
  const visibleColumnIds = sanitizeVisibleColumnIds(['title', 'title', 'score', 'unknown' as never])
  assert.deepEqual(visibleColumnIds, ['title', 'score'])
})

test('有効な表示カラムが1つもない場合は既定値へフォールバックする', () => {
  assert.deepEqual(sanitizeVisibleColumnIds(['unknown' as never]), getDefaultVisibleColumnIds())
})

test('表示カラムの順序を維持してカラム定義を取得できる', () => {
  const columns = getVisibleColumns(['updatedAt', 'title'])
  assert.deepEqual(
    columns.map((column) => column.id),
    ['updatedAt', 'title']
  )
})

test('表示カラム定義からgrid-template-columns文字列を生成できる', () => {
  const columns = getVisibleColumns(['title', 'score'])
  assert.equal(createGridTemplateColumns(columns), 'minmax(11.25rem,1fr) 4.4rem')
})

test('表示カラムIDを定義順に並び替える', () => {
  assert.deepEqual(
    sortVisibleColumnIdsByDefinitionOrder([
      'updatedAt',
      'overpowerPercent',
      'overpower',
      'title',
      'score',
    ]),
    ['title', 'score', 'overpower', 'overpowerPercent', 'updatedAt']
  )
})
