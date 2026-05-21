import assert from 'node:assert/strict'
import test from 'node:test'
import { formatTruncatedFixed } from './numberFormat'

test('指定した小数点以下桁数で切り捨てられること', () => {
  // Given
  const roundedUpByToFixed = 12.3459

  // When
  const result = formatTruncatedFixed(roundedUpByToFixed, 3)

  // Then
  assert.equal(result, '12.345')
})

test('指定した小数点以下桁数まで0埋めされること', () => {
  // Given
  const shortDecimal = 12.3

  // When
  const result = formatTruncatedFixed(shortDecimal, 4)

  // Then
  assert.equal(result, '12.3000')
})
