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

const overPowerValueCases = [
  { value: 0.57, expected: '0.570' },
  { value: 123.4569, expected: '123.456' },
  { value: 999.9999, expected: '999.999' },
] as const

for (const { value, expected } of overPowerValueCases) {
  test(`OVER POWER値 ${value} を小数点以下3桁で切り捨て表示すること`, () => {
    // Given / When
    const result = formatOverPowerValue(value)

    // Then
    assert.equal(result, expected)
  })
}

const overPowerPercentCases = [
  { value: 0.57, expected: '0.5700' },
  { value: 99.99999, expected: '99.9999' },
  { value: 100.00009, expected: '100.0000' },
] as const

for (const { value, expected } of overPowerPercentCases) {
  test(`OVER POWER達成率 ${value} を小数点以下4桁で切り捨て表示すること`, () => {
    // Given / When
    const result = formatOverPowerPercent(value)

    // Then
    assert.equal(result, expected)
  })
}
