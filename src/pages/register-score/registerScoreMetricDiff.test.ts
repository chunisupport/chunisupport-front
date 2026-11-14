import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatRegisterScoreOverPowerDelta,
  formatRegisterScoreOverPowerPercentDelta,
  formatRegisterScoreRatingDelta,
  getRegisterScoreMetricDeltaClass,
} from './registerScoreMetricDiff'

test('レート差分は小数点以下4桁と符号を表示する', () => {
  // Given
  const delta = 0.0125

  // When
  const result = formatRegisterScoreRatingDelta(delta)

  // Then
  assert.equal(result, '+0.0125')
})

test('OVER POWER差分は小数点以下3桁と負符号を表示する', () => {
  // Given
  const delta = -3.787

  // When
  const result = formatRegisterScoreOverPowerDelta(delta)

  // Then
  assert.equal(result, '-3.787')
})

test('OP%の正の差分は小数点以下5桁と正符号を表示する', () => {
  // Given
  const delta = 0.012349

  // When
  const result = formatRegisterScoreOverPowerPercentDelta(delta)

  // Then
  assert.equal(result, '+0.01234')
})

test('OP%の負の差分は小数点以下5桁と負符号を表示する', () => {
  // Given
  const delta = -0.012349

  // When
  const result = formatRegisterScoreOverPowerPercentDelta(delta)

  // Then
  assert.equal(result, '-0.01234')
})

test('OP%の表示桁未満の差分は表示しない', () => {
  // Given
  const delta = 0.000009

  // When
  const result = formatRegisterScoreOverPowerPercentDelta(delta)

  // Then
  assert.equal(result, null)
})

test('表示桁未満の差分は表示しない', () => {
  // Given
  const delta = 0.00001

  // When
  const result = formatRegisterScoreOverPowerDelta(delta)

  // Then
  assert.equal(result, null)
})

test('メトリクス差分の増減に応じた文字色を返すこと', () => {
  // Given: 増加・減少・変化なしの差分。
  const increasedDelta = 1
  const decreasedDelta = -1
  const zeroDelta = 0
  const missingDelta = null

  // When: 差分の文字色を解決する。
  const increased = getRegisterScoreMetricDeltaClass(increasedDelta)
  const decreased = getRegisterScoreMetricDeltaClass(decreasedDelta)
  const zero = getRegisterScoreMetricDeltaClass(zeroDelta)
  const missing = getRegisterScoreMetricDeltaClass(missingDelta)

  // Then: 増加は情報色、減少は危険色、変化なしは通常文字色になる。
  assert.equal(increased, 'text-info')
  assert.equal(decreased, 'text-danger')
  assert.equal(zero, 'text-text')
  assert.equal(missing, 'text-text')
})
