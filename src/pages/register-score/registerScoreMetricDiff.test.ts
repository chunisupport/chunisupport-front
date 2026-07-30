import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatRegisterScoreOverPowerDelta,
  formatRegisterScoreRatingDelta,
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

test('表示桁未満の差分は表示しない', () => {
  // Given
  const delta = 0.00001

  // When
  const result = formatRegisterScoreOverPowerDelta(delta)

  // Then
  assert.equal(result, null)
})
