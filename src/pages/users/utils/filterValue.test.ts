import assert from 'node:assert/strict'
import test from 'node:test'
import { toAllAsEmptyDisplaySelection, toAllAsEmptyFilterSelection } from './filterValue'

const ALL_VALUES = ['A', 'KA', 'SA']

test('空配列のフィルター値は全選択として表示されること', () => {
  // Given
  const selected: string[] = []

  // When
  const result = toAllAsEmptyDisplaySelection(selected, ALL_VALUES)

  // Then
  assert.deepEqual(result, ALL_VALUES)
})

test('一部選択のフィルター値はそのまま表示されること', () => {
  // Given
  const selected = ['KA']

  // When
  const result = toAllAsEmptyDisplaySelection(selected, ALL_VALUES)

  // Then
  assert.deepEqual(result, ['KA'])
})

test('全選択は順序に関係なく空配列のフィルター値へ変換されること', () => {
  // Given
  const selected = ['SA', 'A', 'KA']

  // When
  const result = toAllAsEmptyFilterSelection(selected, ALL_VALUES)

  // Then
  assert.deepEqual(result, [])
})

test('一部選択はそのままフィルター値へ変換されること', () => {
  // Given
  const selected = ['A', 'SA']

  // When
  const result = toAllAsEmptyFilterSelection(selected, ALL_VALUES)

  // Then
  assert.deepEqual(result, ['A', 'SA'])
})
