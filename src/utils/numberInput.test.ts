import assert from 'node:assert/strict'
import test from 'node:test'
import { clampNumericInput } from './numberInput'

test('範囲内の小数と入力途中の小数点を保持すること', () => {
  // Given
  const decimalValue = '10.5'
  const trailingDecimalPoint = '10.'

  // When & Then
  assert.equal(clampNumericInput(decimalValue, 1, 16), decimalValue)
  assert.equal(clampNumericInput(trailingDecimalPoint, 1, 16), trailingDecimalPoint)
})

test('範囲外の数値を入力のたびに上下限へ丸めること', () => {
  // Given & When
  const aboveMax = clampNumericInput('1023401', 0, 1010000)
  const belowMin = clampNumericInput('-1', 0, 1010000)

  // Then
  assert.equal(aboveMax, '1010000')
  assert.equal(belowMin, '0')
})

test('空文字と数値として確定していない入力を保持すること', () => {
  // Given & When & Then
  assert.equal(clampNumericInput('', 0, 10), '')
  assert.equal(clampNumericInput('.', 0, 10), '.')
})
