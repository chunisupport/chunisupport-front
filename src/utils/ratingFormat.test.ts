import assert from 'node:assert/strict'
import test from 'node:test'
import { formatNullablePlayerRating, formatPlayerRating, formatRecordRating } from './ratingFormat'

test('プレイヤーレーティングは小数点以下4桁で切り捨てられること', () => {
  // Given
  const roundedUpByToFixed = 16.99999

  // When
  const result = formatPlayerRating(roundedUpByToFixed)

  // Then
  assert.equal(result, '16.9999')
})

test('プレイヤーレーティングは小数点以下4桁まで0埋めされること', () => {
  // Given
  const shortDecimal = 15.2

  // When
  const result = formatPlayerRating(shortDecimal)

  // Then
  assert.equal(result, '15.2000')
})

test('未計算のプレイヤーレーティングはハイフンを返すこと', () => {
  // Given
  const rating = null

  // When
  const result = formatNullablePlayerRating(rating)

  // Then
  assert.equal(result, '-')
})

test('譜面単位レーティングは小数点以下2桁で切り捨てられること', () => {
  // Given
  const roundedUpByToFixed = 15.239

  // When
  const result = formatRecordRating(roundedUpByToFixed)

  // Then
  assert.equal(result, '15.23')
})

const playerRatingCases = [
  { value: 0.57, expected: '0.5700' },
  { value: 15.2, expected: '15.2000' },
  { value: 16.99999, expected: '16.9999' },
] as const

for (const { value, expected } of playerRatingCases) {
  test(`プレイヤーレーティング ${value} を小数点以下4桁で切り捨て表示すること`, () => {
    // Given / When
    const result = formatPlayerRating(value)

    // Then
    assert.equal(result, expected)
  })
}

const recordRatingCases = [
  { value: 0.57, expected: '0.57' },
  { value: 15.239, expected: '15.23' },
  { value: 16.999, expected: '16.99' },
] as const

for (const { value, expected } of recordRatingCases) {
  test(`譜面単位レーティング ${value} を小数点以下2桁で切り捨て表示すること`, () => {
    // Given / When
    const result = formatRecordRating(value)

    // Then
    assert.equal(result, expected)
  })
}
