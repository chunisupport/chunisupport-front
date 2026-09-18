import assert from 'node:assert/strict'
import test from 'node:test'
import { formatScoreKilo, formatTruncatedFixed, truncateDecimal } from './numberFormat'

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

test('切り捨てた数値でも浮動小数点の下振れを補正すること', () => {
  // Given
  const binaryFloatingPointValue = 1.15

  // When
  const result = truncateDecimal(binaryFloatingPointValue, 2)

  // Then
  assert.equal(result, 1.15)
})

const invalidDecimalPlaceCases = [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY] as const

for (const decimalPlaces of invalidDecimalPlaceCases) {
  test(`小数点以下桁数 ${decimalPlaces} は不正値として扱うこと`, () => {
    // Given
    const value = 12.34

    // When / Then
    assert.throws(
      () => truncateDecimal(value, decimalPlaces),
      new RangeError('decimalPlaces must be a non-negative integer')
    )
  })
}

test('指定した小数点以下桁数まで0埋めされること', () => {
  // Given
  const shortDecimal = 12.3

  // When
  const result = formatTruncatedFixed(shortDecimal, 4)

  // Then
  assert.equal(result, '12.3000')
})

test('千単位で割り切れないスコアは小数点以下最大1桁のk表記になること', () => {
  // Given
  const score = 1009166.6666666666

  // When
  const result = formatScoreKilo(score)

  // Then
  assert.equal(result, '1009.2k')
})
