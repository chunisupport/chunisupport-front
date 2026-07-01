import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clampNumber,
  parseNumberInput,
  parseOptionalRangeNumberInput,
  sanitizeRangeInput,
  toInputValue,
  updateOptionalNumberRange,
} from './rangeInput'

test('toInputValue は未指定値を空文字へ変換すること', () => {
  // Given, When & Then
  assert.equal(toInputValue(undefined), '')
  assert.equal(toInputValue(null), '')
  assert.equal(toInputValue(12.3), '12.3')
})

test('clampNumber は数値を指定範囲へ収めること', () => {
  // Given, When & Then
  assert.equal(clampNumber(-1, 0, 10), 0)
  assert.equal(clampNumber(5, 0, 10), 5)
  assert.equal(clampNumber(12, 0, 10), 10)
})

test('sanitizeRangeInput は許可された文字だけを残すこと', () => {
  // Given
  const rawValue = 'a1.2b3'

  // When
  const result = sanitizeRangeInput(rawValue, /[0-9.]/)

  // Then
  assert.equal(result, '1.23')
})

test('parseNumberInput は確定済みの数値だけを返すこと', () => {
  // Given, When & Then
  assert.equal(parseNumberInput(''), undefined)
  assert.equal(parseNumberInput('.'), undefined)
  assert.equal(parseNumberInput('.5'), 0.5)
  assert.equal(parseNumberInput('5.'), undefined)
  assert.equal(parseNumberInput('12'), 12)
  assert.equal(parseNumberInput('abc'), undefined)
})

test('parseOptionalRangeNumberInput は整数指定と小数桁数を正規化すること', () => {
  // Given, When & Then
  assert.equal(parseOptionalRangeNumberInput('', { min: 0, max: 10 }), null)
  assert.equal(parseOptionalRangeNumberInput('5', { min: 0, max: 10, integer: true }), 5)
  assert.equal(parseOptionalRangeNumberInput('5.5', { min: 0, max: 10, integer: true }), null)
  assert.equal(parseOptionalRangeNumberInput('12', { min: 0, max: 10 }), 10)
  assert.equal(
    parseOptionalRangeNumberInput('1.2345', { min: 0, max: 10, decimalPlaces: 3 }),
    1.235
  )
  assert.equal(parseOptionalRangeNumberInput('9.99', { min: 0, max: 9.99, decimalPlaces: 1 }), 9.99)
})

test('updateOptionalNumberRange は指定された範囲端だけ更新すること', () => {
  // Given
  const current = { min: 1, max: 10 }

  // When
  const result = updateOptionalNumberRange(current, 'min', '3', { min: 0, max: 20 })

  // Then
  assert.deepEqual(result, { min: 3, max: 10 })
})
