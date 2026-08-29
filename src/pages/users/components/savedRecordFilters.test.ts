import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_FILTER } from '../../../utils/recordFilterDefaults'
import { DEFAULT_WORLDSEND_FILTER } from '../WorldsendRecord/types/filterDefaults'
import {
  buildUniqueRecordFilterName,
  hasRecordFilterNameControlCharacter,
  isRecordFilterPayloadWithinLimit,
  isValidRecordFilterName,
  isValidSavedStandardFilter,
  isValidSavedWorldsendFilter,
  RECORD_FILTER_NAME_MAX_LENGTH,
} from './savedRecordFilters'

test('buildUniqueRecordFilterName は重複名へ番号を付与し文字数上限内に収めること', () => {
  // Given
  const baseName = '123456789012345678901234567890'
  const existingNames = [baseName, '123456789012345678901234567(2)']

  // When
  const result = buildUniqueRecordFilterName(baseName, existingNames)

  // Then
  assert.equal(result, '123456789012345678901234567(3)')
  assert.equal(Array.from(result).length, RECORD_FILTER_NAME_MAX_LENGTH)
})

test('isValidRecordFilterName は空欄、長すぎる名前、制御文字を拒否すること', () => {
  // Given, When & Then
  assert.equal(isValidRecordFilterName(' 高難度 '), true)
  assert.equal(isValidRecordFilterName(''), false)
  assert.equal(isValidRecordFilterName('a'.repeat(RECORD_FILTER_NAME_MAX_LENGTH + 1)), false)
  assert.equal(hasRecordFilterNameControlCharacter('改\n行'), true)
  assert.equal(isValidRecordFilterName('改\n行'), false)
})

test('isRecordFilterPayloadWithinLimit はAPIと同じ8KB制限を判定すること', () => {
  // Given
  const smallFilter = { ...DEFAULT_FILTER, title: '短い名前' }
  const largeFilter = { ...DEFAULT_FILTER, title: 'x'.repeat(9000) }

  // When & Then
  assert.equal(isRecordFilterPayloadWithinLimit(3, smallFilter), true)
  assert.equal(isRecordFilterPayloadWithinLimit(3, largeFilter), false)
})

test('isValidSavedStandardFilter は範囲外の定数を壊れたフィルターとして拒否すること', () => {
  // Given
  const brokenFilter = {
    ...DEFAULT_FILTER,
    const: {
      min: 1,
      max: 80,
    },
  }

  // When & Then
  assert.equal(isValidSavedStandardFilter(DEFAULT_FILTER), true)
  assert.equal(isValidSavedStandardFilter(brokenFilter), false)
})

test('isValidSavedStandardFilter は現行と旧形式のOP対象条件を検証すること', () => {
  // Given
  const {
    opTargetOnly: _opTargetOnly,
    opTargetType: _opTargetType,
    ...legacyFilter
  } = DEFAULT_FILTER

  // When & Then
  assert.equal(isValidSavedStandardFilter(legacyFilter), true)
  assert.equal(isValidSavedStandardFilter({ ...legacyFilter, currentOpTargetOnly: true }), true)
  assert.equal(isValidSavedStandardFilter({ ...DEFAULT_FILTER, opTargetOnly: 'true' }), false)
  assert.equal(isValidSavedStandardFilter({ ...DEFAULT_FILTER, opTargetType: 'all' }), false)
  assert.equal(isValidSavedStandardFilter({ ...legacyFilter, currentOpTargetOnly: 'true' }), false)
})

test('isValidSavedStandardFilter はお気に入り条件の省略を旧保存値として許可すること', () => {
  // Given
  const { favoriteSongsOnly: _favoriteSongsOnly, ...legacyFilter } = DEFAULT_FILTER

  // When & Then
  assert.equal(isValidSavedStandardFilter(legacyFilter), true)
  assert.equal(isValidSavedStandardFilter({ ...DEFAULT_FILTER, favoriteSongsOnly: 'true' }), false)
})

test('isValidSavedStandardFilter は未解禁曲除外条件の省略を旧保存値として許可すること', () => {
  // Given
  const { excludeLockedSongs: _excludeLockedSongs, ...legacyFilter } = DEFAULT_FILTER

  // When & Then
  assert.equal(isValidSavedStandardFilter(legacyFilter), true)
  assert.equal(isValidSavedStandardFilter({ ...DEFAULT_FILTER, excludeLockedSongs: 'true' }), false)
})

test('isValidSavedWorldsendFilter は型が違う保存値を壊れたフィルターとして拒否すること', () => {
  // Given
  const brokenFilter = {
    ...DEFAULT_WORLDSEND_FILTER,
    attributes: 80,
  }

  // When & Then
  assert.equal(isValidSavedWorldsendFilter(DEFAULT_WORLDSEND_FILTER), true)
  assert.equal(isValidSavedWorldsendFilter(brokenFilter), false)
})
