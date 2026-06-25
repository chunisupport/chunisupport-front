import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_FILTER } from '../types/filterDefaults'
import {
  formatFilterSummary,
  parseOptionalRangeNumberInput,
  updateOptionalNumberRange,
} from './filterDialog'

test('FULL CHAINランプのフィルター要約は表示用ラベルで出力されること', () => {
  // Given
  const filter = {
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
})

test('updateOptionalNumberRange は指定された範囲端だけ更新すること', () => {
  // Given
  const current = { min: 1, max: 10 }

  // When
  const result = updateOptionalNumberRange(current, 'min', '3', { min: 0, max: 20 })

  // Then
  assert.deepEqual(result, { min: 3, max: 10 })
})
