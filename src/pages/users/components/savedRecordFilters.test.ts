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

test('保存ペイロードは日本語を含めてUTF-8で8192バイトまで許可する', () => {
  // Given: 同一ペイロードの空タイトル時のサイズから、境界値を独立に組み立てる。
  const schemaVersion = 11
  const emptyFilter = { ...DEFAULT_FILTER, title: '' }
  const emptyBytes = Buffer.byteLength(
    JSON.stringify({ schema_version: schemaVersion, filter: emptyFilter }),
    'utf8'
  )
  const title =
    'あ'.repeat(Math.floor((8192 - emptyBytes) / 3)) + 'x'.repeat((8192 - emptyBytes) % 3)
  const boundary = { ...emptyFilter, title }
  const over = { ...boundary, title: `${title}x` }
  assert.equal(
    Buffer.byteLength(JSON.stringify({ schema_version: schemaVersion, filter: boundary }), 'utf8'),
    8192
  )
  assert.equal(
    Buffer.byteLength(JSON.stringify({ schema_version: schemaVersion, filter: over }), 'utf8'),
    8193
  )

  // When & Then: 文字数ではなくUTF-8バイト数で上限を判定する。
  assert.equal(isRecordFilterPayloadWithinLimit(schemaVersion, boundary), true)
  assert.equal(isRecordFilterPayloadWithinLimit(schemaVersion, over), false)
})

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

test('isValidSavedStandardFilter は単曲レート範囲と旧形式の省略を検証すること', () => {
  // Given
  const { rating: _rating, ...legacyFilter } = DEFAULT_FILTER

  // When & Then
  assert.equal(isValidSavedStandardFilter(legacyFilter), true)
  assert.equal(
    isValidSavedStandardFilter({ ...DEFAULT_FILTER, rating: { min: 17.45, max: 18 } }),
    true
  )
  assert.equal(
    isValidSavedStandardFilter({ ...DEFAULT_FILTER, rating: { min: -0.01, max: 18 } }),
    false
  )
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

test('isValidSavedStandardFilter は未プレイのみの省略を旧保存値として許可すること', () => {
  // Given
  const { unplayedOnly: _unplayedOnly, ...legacyFilter } = DEFAULT_FILTER

  // When & Then
  assert.equal(isValidSavedStandardFilter(legacyFilter), true)
  assert.equal(isValidSavedStandardFilter({ ...DEFAULT_FILTER, unplayedOnly: true }), true)
  assert.equal(isValidSavedStandardFilter({ ...DEFAULT_FILTER, unplayedOnly: 'true' }), false)
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

test('isRecordFilterPayloadWithinLimit は上限ちょうどを制限内として許可すること', () => {
  // Given
  const boundaryFilter = { ...DEFAULT_FILTER, title: 'x'.repeat(7470) }
  const overFilter = { ...DEFAULT_FILTER, title: 'x'.repeat(7471) }

  // When
  const boundaryResult = isRecordFilterPayloadWithinLimit(3, boundaryFilter)
  const overResult = isRecordFilterPayloadWithinLimit(3, overFilter)

  // Then
  assert.equal(boundaryResult, true)
  assert.equal(overResult, false)
})

test('isValidSavedStandardFilter はnullを壊れたフィルターとして拒否すること', () => {
  // Given
  const value: unknown = null

  // When
  const result = isValidSavedStandardFilter(value)

  // Then
  assert.equal(result, false)
})

test('isValidSavedWorldsendFilter はnullを壊れたフィルターとして拒否すること', () => {
  // Given
  const value: unknown = null

  // When
  const result = isValidSavedWorldsendFilter(value)

  // Then
  assert.equal(result, false)
})

test('isValidSavedStandardFilter は任意範囲の上限ちょうどを許可すること', () => {
  // Given
  const filter = { ...DEFAULT_FILTER, overPower: { min: 0, max: 95 } }

  // When
  const result = isValidSavedStandardFilter(filter)

  // Then
  assert.equal(result, true)
})

test('isValidSavedStandardFilter は許可外の難易度を含む配列を拒否すること', () => {
  // Given
  const filter = { ...DEFAULT_FILTER, difficulties: ['MASTER', 'INVALID'] }

  // When
  const result = isValidSavedStandardFilter(filter)

  // Then
  assert.equal(result, false)
})

test('isValidSavedStandardFilter は日付範囲の片方だけが文字列の場合を拒否すること', () => {
  // Given
  const filter = { ...DEFAULT_FILTER, updatedAt: { min: '', max: 123 } }

  // When
  const result = isValidSavedStandardFilter(filter)

  // Then
  assert.equal(result, false)
})

test('isValidSavedStandardFilter は定数モードnumberを有効として許可すること', () => {
  // Given
  const filter = { ...DEFAULT_FILTER, constFilterMode: 'number' }

  // When
  const result = isValidSavedStandardFilter(filter)

  // Then
  assert.equal(result, true)
})

test('isValidSavedWorldsendFilter はnullを含む属性配列を有効として許可すること', () => {
  // Given
  const filter = { ...DEFAULT_WORLDSEND_FILTER, attributes: [null] }

  // When
  const result = isValidSavedWorldsendFilter(filter)

  // Then
  assert.equal(result, true)
})

test('isValidSavedWorldsendFilter はnameFolders省略を旧保存値として許可すること', () => {
  // Given
  const { nameFolders: _nameFolders, ...legacyFilter } = DEFAULT_WORLDSEND_FILTER

  // When
  const result = isValidSavedWorldsendFilter(legacyFilter)

  // Then
  assert.equal(result, true)
})

test('isValidSavedWorldsendFilter はスコアモードnumberを有効として許可すること', () => {
  // Given
  const filter = { ...DEFAULT_WORLDSEND_FILTER, scoreFilterMode: 'number' }

  // When
  const result = isValidSavedWorldsendFilter(filter)

  // Then
  assert.equal(result, true)
})

test('isValidSavedWorldsendFilter はupdatedAt省略を旧保存値として許可すること', () => {
  // Given
  const { updatedAt: _updatedAt, ...legacyFilter } = DEFAULT_WORLDSEND_FILTER

  // When
  const result = isValidSavedWorldsendFilter(legacyFilter)

  // Then
  assert.equal(result, true)
})
