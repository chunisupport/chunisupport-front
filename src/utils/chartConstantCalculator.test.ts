import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateChartConstant, resolveLampForScore } from './chartConstantCalculator'

test('理論値が入力された場合はALL JUSTICE CRITICALを選択すること', () => {
  // Given
  const score = 1010000
  const currentLamp = 'NONE'

  // When
  const result = resolveLampForScore(score, currentLamp)

  // Then
  assert.equal(result, 'ALL_JUSTICE_CRITICAL')
})

test('理論値以外では現在のランプを維持すること', () => {
  // Given
  const score = 1009999
  const currentLamp = 'ALL_JUSTICE'

  // When
  const result = resolveLampForScore(score, currentLamp)

  // Then
  assert.equal(result, currentLamp)
})

test('SSS以上のスコアとAJのOVER POWERから譜面定数を逆算できること', () => {
  // Given
  const input = { score: 1009540, overPower: 91.06, lamp: 'ALL_JUSTICE' as const }

  // When
  const result = calculateChartConstant(input)

  // Then
  assert.equal(result.rawChartConstant, 15.4)
  assert.equal(result.estimatedChartConstant, 15.4)
})

test('975,000〜999,999の単曲レート補正を使って逆算できること', () => {
  // Given
  const input = { score: 987500, overPower: 75, lamp: 'NONE' as const }

  // When
  const result = calculateChartConstant(input)

  // Then
  assert.equal(result.rawChartConstant, 14.5)
})

test('1,000,000〜1,004,999の単曲レート補正を使って逆算できること', () => {
  // Given
  const input = { score: 1002500, overPower: 80, lamp: 'FULL_COMBO' as const }

  // When
  const result = calculateChartConstant(input)

  // Then
  assert.equal(result.rawChartConstant, 14.65)
  assert.equal(result.estimatedChartConstant, 14.7)
})

test('1,005,000〜1,007,500の単曲レート補正を使って逆算できること', () => {
  // Given
  const input = { score: 1007500, overPower: 86, lamp: 'ALL_JUSTICE' as const }

  // When
  const result = calculateChartConstant(input)

  // Then
  assert.equal(result.rawChartConstant, 15)
})

test('対応範囲外のスコアはエラーになること', () => {
  // Given
  const input = { score: 974999, overPower: 80, lamp: 'NONE' as const }

  // When & Then
  assert.throws(
    () => calculateChartConstant(input),
    new Error('スコアは975,000〜1,010,000の整数で入力してください。')
  )
})
