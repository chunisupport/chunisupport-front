import assert from 'node:assert/strict'
import test from 'node:test'
import type { FilterState } from '../../../../types/recordFilter'
import { DEFAULT_FILTER } from '../../../../utils/recordFilterDefaults'
import {
  hasJusticeCountFilter,
  hasOverPowerFilter,
  hasRatingFilter,
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

test('isRecordFilterOptionsChanged は単曲レート範囲の変更を検出すること', () => {
  // Given
  const defaultFilter = { ...DEFAULT_FILTER }
  const currentFilter = {
    ...DEFAULT_FILTER,
    rating: { min: 17.45, max: null },
  }

  // When
  const result = isRecordFilterOptionsChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

test('isRecordFilterOptionsChanged は未プレイのみの変更を検出すること', () => {
  // Given
  const defaultFilter = { ...DEFAULT_FILTER }
  const currentFilter = { ...DEFAULT_FILTER, unplayedOnly: true }

  // When
  const result = isRecordFilterOptionsChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

test('isRecordDifficultyFilterOnlyChanged は未プレイのみの変更を難易度だけとは扱わないこと', () => {
  // Given
  const defaultFilter: FilterState = {
    ...DEFAULT_FILTER,
    difficulties: ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'],
  }
  const currentFilter: FilterState = {
    ...DEFAULT_FILTER,
    difficulties: ['MASTER', 'ULTIMA'],
    unplayedOnly: true,
  }

  // When
  const result = isRecordDifficultyFilterOnlyChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, false)
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
  // Given: OP対象フィルターは両方とも有効で、種別だけが異なる
  const defaultFilter = {
    ...DEFAULT_FILTER,
    opTargetOnly: true,
    opTargetType: 'current' as const,
  }
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

test('isRecordFilterOptionsChanged はOP対象フィルターの有効化を検出すること', () => {
  // Given: 種別は同じで、OP対象フィルターの有効・無効だけが異なる
  const defaultFilter = { ...DEFAULT_FILTER, opTargetOnly: false }
  const currentFilter = {
    ...DEFAULT_FILTER,
    opTargetOnly: true,
    opTargetType: defaultFilter.opTargetType,
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

test('hasJusticeCountFilter は上下限とも未指定の場合に無効と判定すること', () => {
  // Given
  const filter: FilterState = {
    ...DEFAULT_FILTER,
    justiceCount: { min: null, max: null },
  }

  // When
  const result = hasJusticeCountFilter(filter)

  // Then
  assert.equal(result, false)
})

test('hasJusticeCountFilter は下限のみ指定の場合に有効と判定すること', () => {
  // Given
  const filter: FilterState = {
    ...DEFAULT_FILTER,
    justiceCount: { min: 100, max: null },
  }

  // When
  const result = hasJusticeCountFilter(filter)

  // Then
  assert.equal(result, true)
})

test('hasJusticeCountFilter は上限のみ指定の場合に有効と判定すること', () => {
  // Given
  const filter: FilterState = {
    ...DEFAULT_FILTER,
    justiceCount: { min: null, max: 200 },
  }

  // When
  const result = hasJusticeCountFilter(filter)

  // Then
  assert.equal(result, true)
})

test('hasOverPowerFilter は上下限とも未指定の場合に無効と判定すること', () => {
  // Given
  const filter: FilterState = {
    ...DEFAULT_FILTER,
    overPower: { min: null, max: null },
  }

  // When
  const result = hasOverPowerFilter(filter)

  // Then
  assert.equal(result, false)
})

test('hasOverPowerFilter は下限のみ指定の場合に有効と判定すること', () => {
  // Given
  const filter: FilterState = {
    ...DEFAULT_FILTER,
    overPower: { min: 90, max: null },
  }

  // When
  const result = hasOverPowerFilter(filter)

  // Then
  assert.equal(result, true)
})

test('hasOverPowerFilter は上限のみ指定の場合に有効と判定すること', () => {
  // Given
  const filter: FilterState = {
    ...DEFAULT_FILTER,
    overPower: { min: null, max: 95 },
  }

  // When
  const result = hasOverPowerFilter(filter)

  // Then
  assert.equal(result, true)
})

test('hasRatingFilter は上下限とも未指定の場合に無効と判定すること', () => {
  // Given
  const filter: FilterState = {
    ...DEFAULT_FILTER,
    rating: { min: null, max: null },
  }

  // When
  const result = hasRatingFilter(filter)

  // Then
  assert.equal(result, false)
})

test('hasRatingFilter は下限のみ指定の場合に有効と判定すること', () => {
  // Given
  const filter: FilterState = {
    ...DEFAULT_FILTER,
    rating: { min: 15.5, max: null },
  }

  // When
  const result = hasRatingFilter(filter)

  // Then
  assert.equal(result, true)
})

test('hasRatingFilter は上限のみ指定の場合に有効と判定すること', () => {
  // Given
  const filter: FilterState = {
    ...DEFAULT_FILTER,
    rating: { min: null, max: 16.5 },
  }

  // When
  const result = hasRatingFilter(filter)

  // Then
  assert.equal(result, true)
})

test('isRecordDifficultyFilterOnlyChanged はOP対象無効時の種別差異を無視して難易度だけの変更と判定すること', () => {
  // Given
  const defaultFilter: FilterState = {
    ...DEFAULT_FILTER,
    difficulties: ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'],
  }
  const currentFilter: FilterState = {
    ...DEFAULT_FILTER,
    difficulties: ['MASTER', 'ULTIMA'],
    opTargetType: 'theoretical',
  }

  // When
  const result = isRecordDifficultyFilterOnlyChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})
