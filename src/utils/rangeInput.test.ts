import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clampNumber,
  normalizeChartConstRangeInput,
  normalizeHundredthsInput,
  normalizeScoreRangeInput,
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

test('normalizeChartConstRangeInput は小数入力を保持し譜面定数範囲へ収めること', () => {
  // Given, When & Then
  assert.equal(normalizeChartConstRangeInput('13.'), '13.')
  assert.equal(normalizeChartConstRangeInput('13.5'), '13.5')
  assert.equal(normalizeChartConstRangeInput('999'), '16.0')
  assert.equal(normalizeChartConstRangeInput('abc'), null)
})

test('normalizeScoreRangeInput は整数だけを許可しスコア範囲へ収めること', () => {
  // Given, When & Then
  assert.equal(normalizeScoreRangeInput(''), '')
  assert.equal(normalizeScoreRangeInput('1007500'), '1007500')
  assert.equal(normalizeScoreRangeInput('1023401'), '1010000')
  assert.equal(normalizeScoreRangeInput('100.5'), null)
  assert.equal(normalizeScoreRangeInput('abc'), null)
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

test('normalizeHundredthsInput は小数第2位までの数値入力を受け入れる', () => {
  // Given
  const values = ['', '12', '12.', '12.3', '12.34', '.5']

  // When
  const results = values.map((value) => normalizeHundredthsInput(value))

  // Then
  assert.deepEqual(results, values)
})

test('normalizeHundredthsInput は数値以外や小数第3位以降を拒否する', () => {
  // Given
  const values = ['a', '12a', '-1', '1.2.3', '12.345', '1e3', ' 1']

  // When
  const results = values.map((value) => normalizeHundredthsInput(value))

  // Then
  assert.deepEqual(
    results,
    values.map(() => null)
  )
})

test('normalizeHundredthsInput は全角数字を半角へ変換し、上限を超える値を上限へ収める', () => {
  // Given, When
  const fullWidth = normalizeHundredthsInput('１２．３')
  const overMax = normalizeHundredthsInput('100.5', 100)

  // Then
  assert.equal(fullWidth, '12.3')
  assert.equal(overMax, '100.00')
})
