import assert from 'node:assert/strict'
import test from 'node:test'
import { formatOverPowerPercent, formatOverPowerValue } from './overPowerFormat'

test('OVER POWER値は小数点以下3桁で切り捨てられること', () => {
  // Given
  const roundedUpByToFixed = 123.4569

  // When
  const result = formatOverPowerValue(roundedUpByToFixed)

  // Then
  assert.equal(result, '123.456')
})

test('OVER POWER値は小数点以下3桁まで0埋めされること', () => {
  // Given
  const shortDecimal = 123.45

  // When
  const result = formatOverPowerValue(shortDecimal)

  // Then
  assert.equal(result, '123.450')
})

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

test('OVER POWER達成率は指定した小数点以下桁数で切り捨てられること', () => {
  // Given
  const roundedUpByToFixed = 87.659

  // When
  const result = formatOverPowerPercent(roundedUpByToFixed, 2)

  // Then
  assert.equal(result, '87.65')
})
