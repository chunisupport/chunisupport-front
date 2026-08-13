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

const metricDeltaClassCases = [
  { delta: 0.01, expected: 'text-info' },
  { delta: -0.01, expected: 'text-danger' },
  { delta: 0, expected: 'text-text' },
  { delta: null, expected: 'text-text' },
] as const

for (const { delta, expected } of metricDeltaClassCases) {
  test(`メトリクス差分 ${delta} に対応するデザイントークンを返す`, () => {
    // Given / When
    const result = getRegisterScoreMetricDeltaClass(delta)

    // Then
    assert.equal(result, expected)
  })
}
