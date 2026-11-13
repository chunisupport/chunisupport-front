import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateChartConstant, resolveLampForScore } from './chartConstantCalculator'

for (const [score, overPower] of [
  [999999, 74.9998],
  [1000000, 75],
  [1000001, 75.0005],
  [1004999, 77.4995],
  [1005000, 77.5],
  [1005001, 77.501],
  [1007499, 79.999],
  [1007500, 80],
  [1007501, 80.0015],
]) {
  test(`区分境界と隣接スコアから譜面定数を逆算する: ${score}`, () => {
    // Given: 譜面定数14.0・コンボ補正なしで独立に算出したスコアとOP。
    // When
    const result = calculateChartConstant({ score, overPower, lamp: 'NONE' })

    // Then: 丸め後だけでなく生の定数も一致する。
    assert.equal(result.rawChartConstant, 14)
    assert.equal(result.estimatedChartConstant, 14)
  })
}

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

test('下限スコア975000でも譜面定数を逆算できること', () => {
  // Given
  const input = { score: 975000, overPower: 75, lamp: 'NONE' as const }

  // When
  const result = calculateChartConstant(input)

  // Then
  assert.equal(result.rawChartConstant, 15)
  assert.equal(result.estimatedChartConstant, 15)
})

test('上限スコア1010000でも譜面定数を逆算できること', () => {
  // Given
  const input = { score: 1010000, overPower: 92, lamp: 'ALL_JUSTICE_CRITICAL' as const }

  // When
  const result = calculateChartConstant(input)

  // Then
  assert.equal(result.rawChartConstant, 15.4)
  assert.equal(result.estimatedChartConstant, 15.4)
})

test('OVER POWERが0でも譜面定数を逆算できること', () => {
  // Given
  const input = { score: 975000, overPower: 0, lamp: 'NONE' as const }

  // When
  const result = calculateChartConstant(input)

  // Then
  assert.equal(result.rawChartConstant, 0)
  assert.equal(result.estimatedChartConstant, 0)
})

test('負のOVER POWERはエラーになること', () => {
  // Given
  const input = { score: 1000000, overPower: -1, lamp: 'NONE' as const }

  // When & Then
  assert.throws(
    () => calculateChartConstant(input),
    new Error('OVER POWERは0以上の数値で入力してください。')
  )
})
