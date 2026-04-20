import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createGridTemplateColumns,
  getDefaultVisibleColumnIds,
  getVisibleColumns,
  sanitizeVisibleColumnIds,
} from './columns.ts'

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
    ['title', 'updatedAt']
  )
})

test('表示カラム定義からgrid-template-columns文字列を生成できる', () => {
  const columns = getVisibleColumns(['title', 'score'])
  assert.equal(createGridTemplateColumns(columns), 'minmax(11.25rem,1fr) 3.6rem')
})
