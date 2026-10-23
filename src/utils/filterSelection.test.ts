import assert from 'node:assert/strict'
import test from 'node:test'
import {
  hasSameNullableFilterValues,
  isNullableSelectionMatched,
  matchesNullableVersionFilter,
  matchesRecordVersionFilter,
  normalizeVersionFilterSelection,
  toNullableAllDisplaySelection,
  toNullableAllFilterSelection,
} from './filterSelection'

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

test('null のフィルター値は不明な値も含めて一致すること', () => {
  // Given
  const selected = null

  // When / Then
  assert.equal(isNullableSelectionMatched('A', selected), true)
  assert.equal(isNullableSelectionMatched(null, selected), true)
})

test('選択値がある場合は含まれる値だけ一致し、不明な値は一致しないこと', () => {
  // Given
  const selected = ['A', 'KA']

  // When / Then
  assert.equal(isNullableSelectionMatched('KA', selected), true)
  assert.equal(isNullableSelectionMatched('SA', selected), false)
  assert.equal(isNullableSelectionMatched(undefined, selected), false)
})

test('空配列のフィルター値はどの値にも一致しないこと', () => {
  // Given
  const selected: string[] = []

  // When / Then
  assert.equal(isNullableSelectionMatched('A', selected), false)
})

test('バージョンの全選択は未指定へ揃えること', () => {
  // Given
  const allVersions = ['VERSE', 'X-VERSE']

  // When / Then
  assert.equal(normalizeVersionFilterSelection(null, allVersions), null)
  assert.equal(normalizeVersionFilterSelection(['X-VERSE', 'VERSE'], allVersions), null)
  assert.deepEqual(normalizeVersionFilterSelection(['VERSE'], allVersions), ['VERSE'])
  assert.deepEqual(normalizeVersionFilterSelection([], allVersions), [])
})

test('レコードのバージョン条件は全選択と空配列で不明を含め、一部選択では除外すること', () => {
  // Given
  const unknown = '不明'

  // When / Then
  assert.equal(matchesRecordVersionFilter(unknown, null), true)
  assert.equal(matchesRecordVersionFilter(unknown, []), true)
  assert.equal(matchesRecordVersionFilter('VERSE', ['VERSE']), true)
  assert.equal(matchesRecordVersionFilter(unknown, ['VERSE']), false)
})

test('null のバージョン条件は不明を含め、空配列は一致しないこと', () => {
  // Given
  const unknown = '不明'

  // When / Then
  assert.equal(matchesNullableVersionFilter(unknown, null), true)
  assert.equal(matchesNullableVersionFilter('NEW', null), true)
  assert.equal(matchesNullableVersionFilter(unknown, []), false)
  assert.equal(matchesNullableVersionFilter('NEW', ['NEW']), true)
  assert.equal(matchesNullableVersionFilter(unknown, ['NEW']), false)
})
