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

const floatingPointDriftCases = [
  { value: 0.29, decimalPlaces: 2, expected: '0.29' },
  { value: 0.57, decimalPlaces: 2, expected: '0.57' },
  { value: 0.57, decimalPlaces: 4, expected: '0.5700' },
  { value: 0.58, decimalPlaces: 2, expected: '0.58' },
  { value: 1.13, decimalPlaces: 2, expected: '1.13' },
  { value: 1.15, decimalPlaces: 2, expected: '1.15' },
  { value: 2.55, decimalPlaces: 2, expected: '2.55' },
  { value: 10.29, decimalPlaces: 1, expected: '10.2' },
  { value: 10.29, decimalPlaces: 2, expected: '10.29' },
  { value: 12.29, decimalPlaces: 2, expected: '12.29' },
  { value: -0.29, decimalPlaces: 2, expected: '-0.29' },
] as const

for (const { value, decimalPlaces, expected } of floatingPointDriftCases) {
  test(`浮動小数点の下振れを補正して ${value} を小数${decimalPlaces}桁で表示できること`, () => {
    // Given / When
    const result = formatTruncatedFixed(value, decimalPlaces)

    // Then
    assert.equal(result, expected)
  })
}

const noRoundUpCases = [
  { value: 1.005, decimalPlaces: 2, expected: '1.00' },
  { value: 2.675, decimalPlaces: 2, expected: '2.67' },
  { value: 12.3459, decimalPlaces: 3, expected: '12.345' },
  { value: 14.999, decimalPlaces: 1, expected: '14.9' },
  { value: 99.99999, decimalPlaces: 4, expected: '99.9999' },
  { value: 123.4569, decimalPlaces: 3, expected: '123.456' },
] as const

for (const { value, decimalPlaces, expected } of noRoundUpCases) {
  test(`補正値で ${value} を小数${decimalPlaces}桁へ繰り上げないこと`, () => {
    // Given / When
    const result = formatTruncatedFixed(value, decimalPlaces)

    // Then
    assert.equal(result, expected)
  })
}

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

test('整数を日本語ロケールの区切り文字列へ整形すること', () => {
  // Given
  const score = 1007500

  // When
  const result = formatInteger(score)

  // Then
  assert.equal(result, '1,007,500')
})
