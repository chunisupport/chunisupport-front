import assert from 'node:assert/strict'
import test from 'node:test'
import {
  hasSameNullableFilterValues,
  toNullableAllDisplaySelection,
  toNullableAllFilterSelection,
} from './filterValue'

const ALL_VALUES = ['A', 'KA', 'SA']

test('null のフィルター値は全選択として表示されること', () => {
  // Given
  const selected = null

  // When
  const result = toNullableAllDisplaySelection(selected, ALL_VALUES)

  // Then
  assert.deepEqual(result, ALL_VALUES)
})

test('空配列のフィルター値は未選択のまま表示されること', () => {
  // Given
  const selected: string[] = []

  // When
  const result = toNullableAllDisplaySelection(selected, ALL_VALUES)

  // Then
  assert.deepEqual(result, [])
})

test('全選択は順序に関係なく null のフィルター値へ変換されること', () => {
  // Given
  const selected = ['SA', 'A', 'KA']

  // When
  const result = toNullableAllFilterSelection(selected, ALL_VALUES)

  // Then
  assert.equal(result, null)
})

test('一部選択と全解除はそのままフィルター値へ変換されること', () => {
  // Given / When
  const partial = toNullableAllFilterSelection(['A', 'SA'], ALL_VALUES)
  const cleared = toNullableAllFilterSelection([], ALL_VALUES)

  // Then
  assert.deepEqual(partial, ['A', 'SA'])
  assert.deepEqual(cleared, [])
})

test('選択肢が未取得の場合は空選択を全選択として扱わないこと', () => {
  // Given / When
  const result = toNullableAllFilterSelection([], [])

  // Then
  assert.deepEqual(result, [])
})

test('null を全選択とするフィルター値を比較できること', () => {
  // Given / When / Then
  assert.equal(hasSameNullableFilterValues(null, null), true)
  assert.equal(hasSameNullableFilterValues(null, []), false)
  assert.equal(hasSameNullableFilterValues(['A', 'KA'], ['KA', 'A']), true)
  assert.equal(hasSameNullableFilterValues(['A'], ['KA']), false)
})
