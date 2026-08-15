import assert from 'node:assert/strict'
import test from 'node:test'
import { formatChartConst, truncateChartConst } from './chartConstFormat'

test('譜面定数は小数点以下1桁で切り捨てられること', () => {
  // Given
  const roundedUpByToFixed = 14.999

  // When
  const result = formatChartConst(roundedUpByToFixed)

  // Then
  assert.equal(result, '14.9')
})

test('譜面定数は小数点以下1桁まで0埋めされること', () => {
  // Given
  const shortDecimal = 13

  // When
  const result = formatChartConst(shortDecimal)

  // Then
  assert.equal(result, '13.0')
})

test('譜面定数を小数点以下1桁の数値へ切り捨てること', () => {
  // Given
  const roundedUpByToFixed = 12.789

  // When
  const result = truncateChartConst(roundedUpByToFixed)

  // Then
  assert.equal(result, 12.7)
})

const chartConstCases = [
  { value: 13.79, expected: '13.7' },
  { value: 14.99, expected: '14.9' },
  { value: 15.09, expected: '15.0' },
  { value: 15.1, expected: '15.1' },
] as const

for (const { value, expected } of chartConstCases) {
  test(`譜面定数 ${value} を小数点以下1桁で切り捨て表示すること`, () => {
    // Given / When
    const result = formatChartConst(value)

    // Then
    assert.equal(result, expected)
  })
}
