import assert from 'node:assert/strict'
import test from 'node:test'
import type { FilterState } from '../../../../types/recordFilter'
import { DEFAULT_FILTER } from '../../../../utils/recordFilterDefaults'
import {
  formatFilterSummary,
  isRecordDifficultyFilterOnlyChanged,
  isRecordFilterChanged,
  isRecordFilterOptionsChanged,
  parseOptionalRangeNumberInput,
  updateOptionalNumberRange,
} from './filterDialog'

test('FULL CHAINランプのフィルター要約は表示用ラベルで出力されること', () => {
  // Given
  const filter: FilterState = {
    ...DEFAULT_FILTER,
    chain_lamp: ['FULL CHAIN PLATINUM', 'FULL CHAIN GOLD', null],
  }

  // When
  const result = formatFilterSummary(filter)

  // Then
  assert.match(result, /FULL CHAIN: FULL CHAIN \(PLATINUM\),FULL CHAIN \(GOLD\),なし/)
})

test('formatFilterSummary はJUSTICE数とOVER POWERの範囲を出力すること', () => {
  // Given
  const filter = {
    ...DEFAULT_FILTER,
    justiceCount: {
      min: 1,
      max: null,
    },
    overPower: {
      min: 80.123,
      max: 95,
    },
  }

  // When
  const result = formatFilterSummary(filter)

  // Then
  assert.match(result, /JUSTICE数: 1-/)
  assert.match(result, /OVER POWER: 80.123-95/)
})

test('formatFilterSummary はOP対象のみの条件を出力すること', () => {
  // Given
  const filter = {
    ...DEFAULT_FILTER,
    currentOpTargetOnly: true,
  }

  // When
  const result = formatFilterSummary(filter)

  // Then
  assert.match(result, /OP対象の楽曲のみ/)
})

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

test('isRecordFilterChanged は既定値と同じ条件を未変更として扱うこと', () => {
  // Given
  const defaultFilter = { ...DEFAULT_FILTER }
  const currentFilter = { ...DEFAULT_FILTER }

  // When
  const result = isRecordFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, false)
})

test('isRecordFilterChanged はタイトル検索の変更を検出すること', () => {
  // Given
  const defaultFilter = { ...DEFAULT_FILTER }
  const currentFilter = { ...DEFAULT_FILTER, title: 'テスト' }

  // When
  const result = isRecordFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
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

test('isRecordFilterChanged は配列の順序だけが違う場合を未変更として扱うこと', () => {
  // Given
  const defaultFilter = {
    ...DEFAULT_FILTER,
    genres: ['POPS & ANIME', 'niconico'],
  }
  const currentFilter = {
    ...DEFAULT_FILTER,
    genres: ['niconico', 'POPS & ANIME'],
  }

  // When
  const result = isRecordFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, false)
})

test('isRecordFilterChanged は選択値の差分を検出すること', () => {
  // Given
  const defaultFilter = {
    ...DEFAULT_FILTER,
    versions: ['CHUNITHM SUN', 'CHUNITHM LUMINOUS'],
  }
  const currentFilter = {
    ...DEFAULT_FILTER,
    versions: ['CHUNITHM LUMINOUS'],
  }

  // When
  const result = isRecordFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

test('isRecordFilterChanged は数値範囲の変更を検出すること', () => {
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
  const result = isRecordFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

test('isRecordFilterChanged はnullを含むランプ配列の差分を検出すること', () => {
  // Given
  const defaultFilter: FilterState = {
    ...DEFAULT_FILTER,
    combo_lamp: [null, 'FULL COMBO', 'ALL JUSTICE'],
  }
  const currentFilter: FilterState = {
    ...DEFAULT_FILTER,
    combo_lamp: ['FULL COMBO', 'ALL JUSTICE'],
  }

  // When
  const result = isRecordFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
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
