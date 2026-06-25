import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateOverPowerDifference,
  calculateOverPowerPercent,
  calculateRequiredOverPower,
  formatOverPowerInputValue,
  parseOverPowerInput,
} from './overPowerCalculator'

test('calculateOverPowerPercent は現在値と理論値から達成率を計算すること', () => {
  // Given
  const current = 975
  const max = 1000

  // When
  const result = calculateOverPowerPercent(current, max)

  // Then
  assert.equal(result, 97.5)
})

test('calculateRequiredOverPower は目標%から必要OVER POWER値を計算すること', () => {
  // Given
  const percent = 99.5
  const max = 1200

  // When
  const result = calculateRequiredOverPower(percent, max)

  // Then
  assert.equal(result, 1194)
})

test('calculateOverPowerDifference は必要値と現在値の差分を計算すること', () => {
  // Given
  const required = 1194
  const current = 1180.25

  // When
  const result = calculateOverPowerDifference(required, current)

  // Then
  assert.equal(result, 13.75)
})

test('parseOverPowerInput は空欄と不正な数値をnullへ変換すること', () => {
  // Given
  const emptyValue = ''
  const invalidValue = 'abc'

  // When & Then
  assert.equal(parseOverPowerInput(emptyValue), null)
  assert.equal(parseOverPowerInput(invalidValue), null)
})

test('formatOverPowerInputValue は不要な末尾0を省くこと', () => {
  // Given
  const value = 123.4

  // When
  const result = formatOverPowerInputValue(value)

  // Then
  assert.equal(result, '123.4')
})
