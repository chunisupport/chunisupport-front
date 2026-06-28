import assert from 'node:assert/strict'
import test from 'node:test'
import { formatNullablePlayerRating, formatPlayerRating } from './ratingFormat.ts'

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
