import assert from 'node:assert/strict'
import test from 'node:test'
import { quantile } from './quantile'

test('1件からなる数列ではどの分位点でもその値を返すこと', () => {
  // Given
  const sortedValues = [42]

  // When & Then
  assert.equal(quantile(sortedValues, 0), 42)
  assert.equal(quantile(sortedValues, 0.5), 42)
  assert.equal(quantile(sortedValues, 1), 42)
})

test('偶数件の数列で中央値は線形補間した値になること', () => {
  // Given
  const sortedValues = [1, 2, 3, 4]

  // When
  const median = quantile(sortedValues, 0.5)

  // Then
  assert.equal(median, 2.5)
})

test('奇数件の数列で中央値はちょうど中央の値になること', () => {
  // Given
  const sortedValues = [1, 2, 3, 4, 5]

  // When
  const median = quantile(sortedValues, 0.5)

  // Then
  assert.equal(median, 3)
})

test('分位0と分位1は最小値と最大値を返すこと', () => {
  // Given
  const sortedValues = [10, 20, 30, 40, 50]

  // When & Then
  assert.equal(quantile(sortedValues, 0), 10)
  assert.equal(quantile(sortedValues, 1), 50)
})

test('四分位数が線形補間の仕様どおりに算出されること', () => {
  // Given
  const sortedValues = [1, 2, 3, 4]

  // When
  const q1 = quantile(sortedValues, 0.25)
  const q3 = quantile(sortedValues, 0.75)

  // Then
  assert.equal(q1, 1.75)
  assert.equal(q3, 3.25)
})
