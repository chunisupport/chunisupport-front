import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findGenreIdByName,
  findGenreNameById,
  formatUpdatedAt,
  hasNotesDesigner,
  toDateInputValue,
  toDateOnly,
  toNullableTrimmedString,
  toOptionalNumberInput,
  toOptionalTextInput,
} from './songDraftCommon'

const genres = [
  { id: 1, name: 'POPS & ANIME' },
  { id: 2, name: 'ORIGINAL' },
]

test('日付のみの文字列はそのまま日付として扱うこと', () => {
  // Given
  const value = ' 2025-01-02 '

  // When
  const result = toDateOnly(value)

  // Then
  assert.equal(result, '2025-01-02')
})

test('日時文字列は先頭の日付部分を取り出すこと', () => {
  // Given
  const value = '2025-01-02T23:59:59+09:00'

  // When
  const result = toDateOnly(value)

  // Then
  assert.equal(result, '2025-01-02')
})

test('空文字や解釈できない文字列は null になること', () => {
  // Given / When / Then
  assert.equal(toDateOnly(null), null)
  assert.equal(toDateOnly('   '), null)
  assert.equal(toDateOnly('invalid'), null)
  assert.equal(toDateInputValue(null), '')
})

test('更新日時は日本時間で整形し、不正値は - になること', () => {
  // Given
  const value = '2025-01-01T15:00:00Z'

  // When
  const result = formatUpdatedAt(value)

  // Then
  assert.equal(result, '2025/1/2 00:00:00')
  assert.equal(formatUpdatedAt(null), '-')
  assert.equal(formatUpdatedAt('invalid'), '-')
})

test('BASIC・ADVANCED は NOTES DESIGNER の入力対象外であること', () => {
  // Given / When / Then
  assert.equal(hasNotesDesigner('BASIC'), false)
  assert.equal(hasNotesDesigner('ADVANCED'), false)
  assert.equal(hasNotesDesigner('EXPERT'), true)
  assert.equal(hasNotesDesigner('ULTIMA'), true)
})

test('入力値の正規化で空白のみ・空文字を null として扱うこと', () => {
  // Given / When / Then
  assert.equal(toNullableTrimmedString('  abc  '), 'abc')
  assert.equal(toNullableTrimmedString('   '), null)
  assert.equal(toOptionalTextInput(' abc '), ' abc ')
  assert.equal(toOptionalTextInput('  '), null)
  assert.equal(toOptionalNumberInput(''), null)
  assert.equal(toOptionalNumberInput('180'), 180)
})

test('ジャンル名とジャンルIDを相互に解決し、未登録なら null になること', () => {
  // Given / When / Then
  assert.equal(findGenreIdByName(genres, 'ORIGINAL'), 2)
  assert.equal(findGenreIdByName(genres, '未登録'), null)
  assert.equal(findGenreNameById(genres, 1), 'POPS & ANIME')
  assert.equal(findGenreNameById(genres, null), null)
})
