import assert from 'node:assert/strict'
import test from 'node:test'
import { formatInteger, formatTruncatedFixed, truncateDecimal } from './numberFormat'

test('指定した小数点以下桁数で切り捨てられること', () => {
  // Given
  const roundedUpByToFixed = 12.3459

  // When
  const result = formatTruncatedFixed(roundedUpByToFixed, 3)

  // Then
  assert.equal(result, '12.345')
})

test('浮動小数点の内部誤差で切り捨て桁がずれないこと', () => {
  // Given
  const binaryFloatingPointValue = 0.29

  // When
  const result = formatTruncatedFixed(binaryFloatingPointValue, 2)

  // Then
  assert.equal(result, '0.29')
})

test('切り捨てた数値を返すこと', () => {
  // Given
  const roundedUpByToFixed = 99.99999

  // When
  const result = truncateDecimal(roundedUpByToFixed, 4)

  // Then
  assert.equal(result, 99.9999)
})

test('指定した小数点以下桁数まで0埋めされること', () => {
  // Given
  const shortDecimal = 12.3

  // When
  const result = formatTruncatedFixed(shortDecimal, 4)

  // Then
  assert.equal(result, '12.3000')
})

test('整数を日本語ロケールの区切り文字列へ整形すること', () => {
  // Given
  const score = 1007500

  // When
  const result = formatInteger(score)

  // Then
  assert.equal(result, '1,007,500')
})
