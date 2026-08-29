import assert from 'node:assert/strict'
import test from 'node:test'
import type { FilterState } from '../../../../types/recordFilter'
import { DEFAULT_FILTER } from '../../../../utils/recordFilterDefaults'
import {
  isRecordDifficultyFilterOnlyChanged,
  isRecordFilterOptionsChanged,
  parseOptionalRangeNumberInput,
  updateOptionalNumberRange,
} from './filterDialog'

test('parseOptionalRangeNumberInput は整数指定と小数桁数を正規化すること', () => {
  // Given, When & Then
  assert.equal(parseOptionalRangeNumberInput('', { min: 0, max: 10 }), null)
  assert.equal(parseOptionalRangeNumberInput('5', { min: 0, max: 10, integer: true }), 5)
  assert.equal(parseOptionalRangeNumberInput('5.5', { min: 0, max: 10, integer: true }), null)
  assert.equal(parseOptionalRangeNumberInput('12', { min: 0, max: 10 }), 10)
  assert.equal(
    parseOptionalRangeNumberInput('1.2345', { min: 0, max: 10, decimalPlaces: 3 }),
    1.235
  )
  assert.equal(parseOptionalRangeNumberInput('9.99', { min: 0, max: 9.99, decimalPlaces: 1 }), 9.99)
})

test('updateOptionalNumberRange は指定された範囲端だけ更新すること', () => {
  // Given
  const current = { min: 1, max: 10 }

  // When
  const result = updateOptionalNumberRange(current, 'min', '3', { min: 0, max: 20 })

  // Then
  assert.deepEqual(result, { min: 3, max: 10 })
})

test('isRecordFilterOptionsChanged はタイトル検索だけの変更を対象外にすること', () => {
  // Given
  const defaultFilter = { ...DEFAULT_FILTER }
  const currentFilter = { ...DEFAULT_FILTER, title: 'テスト' }

  // When
  const result = isRecordFilterOptionsChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, false)
})

test('isRecordFilterOptionsChanged はタイトル検索以外の変更を検出すること', () => {
  // Given
  const defaultFilter = { ...DEFAULT_FILTER }
  const currentFilter = {
    ...DEFAULT_FILTER,
    overPower: {
      min: 90,
      max: null,
    },
  }

  // When
  const result = isRecordFilterOptionsChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

test('isRecordFilterOptionsChanged は未解禁曲除外の変更を検出すること', () => {
  // Given
  const defaultFilter = { ...DEFAULT_FILTER }
  const currentFilter = { ...DEFAULT_FILTER, excludeLockedSongs: true }

  // When
  const result = isRecordFilterOptionsChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

test('isRecordFilterOptionsChanged は有効なOP対象種別の変更を検出すること', () => {
  // Given
  const defaultFilter = { ...DEFAULT_FILTER }
  const currentFilter = {
    ...DEFAULT_FILTER,
    opTargetOnly: true,
    opTargetType: 'theoretical' as const,
  }

  // When
  const result = isRecordFilterOptionsChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

test('isRecordFilterOptionsChanged は無効なOP対象種別の保持値を対象外にすること', () => {
  // Given
  const defaultFilter = { ...DEFAULT_FILTER }
  const currentFilter = { ...DEFAULT_FILTER, opTargetType: 'theoretical' as const }

  // When
  const result = isRecordFilterOptionsChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, false)
})

test('isRecordDifficultyFilterOnlyChanged は難易度選択だけの変更を検出すること', () => {
  // Given
  const defaultFilter: FilterState = {
    ...DEFAULT_FILTER,
    difficulties: ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'],
  }
  const currentFilter: FilterState = {
    ...DEFAULT_FILTER,
    difficulties: ['MASTER', 'ULTIMA'],
  }

  // When
  const result = isRecordDifficultyFilterOnlyChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

test('isRecordDifficultyFilterOnlyChanged は難易度以外も変わる場合を対象外にすること', () => {
  // Given
  const defaultFilter: FilterState = {
    ...DEFAULT_FILTER,
    difficulties: ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'],
  }
  const currentFilter: FilterState = {
    ...DEFAULT_FILTER,
    difficulties: ['MASTER', 'ULTIMA'],
    genres: ['POPS & ANIME'],
  }

  // When
  const result = isRecordDifficultyFilterOnlyChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, false)
})
