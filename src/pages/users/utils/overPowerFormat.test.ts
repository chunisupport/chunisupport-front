import assert from 'node:assert/strict'
import test from 'node:test'
import { formatOverPowerPercent } from './overPowerFormat'

test('OVER POWER達成率は小数点以下4桁で切り捨てられること', () => {
  // Given
  const roundedUpByToFixed = 99.99999

  // When
  const result = formatOverPowerPercent(roundedUpByToFixed)

  // Then
  assert.equal(result, '99.9999')
})

test('OVER POWER達成率は小数点以下4桁まで0埋めされること', () => {
  // Given
  const shortDecimal = 12.3

  // When
  const result = formatOverPowerPercent(shortDecimal)

  // Then
  assert.equal(result, '12.3000')
})
