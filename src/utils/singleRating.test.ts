import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateSingleRatingHundredths } from './singleRating'

/**
 * 譜面定数14.5での単曲レーティング（0.01単位）。
 * 期待値はランク境界の公式補正値（SSS+ +2.15、SSS +2.0、SS+ +1.5、SS +1.0、S+ +0.6、S ±0、
 * AAA -1.67、AA -3.34、A -5.0、BBB (定数-5)/2、C 0）と、境界間の線形補間を切り捨てた値から求めている。
 */
const cases: [string, number, number][] = [
  ['理論値', 1_010_000, 1665],
  ['SSS+', 1_009_000, 1665],
  ['SSS+直前', 1_008_999, 1664],
  ['SSS', 1_007_500, 1650],
  ['SSS直前', 1_007_499, 1649],
  ['SS+', 1_005_000, 1600],
  ['SS+直前', 1_004_999, 1599],
  ['SS', 1_000_000, 1550],
  ['SS直前', 999_999, 1549],
  ['S+', 990_000, 1510],
  ['S+直前', 989_999, 1509],
  ['S', 975_000, 1450],
  ['S直前', 974_999, 1449],
  ['AAA', 950_000, 1283],
  ['AA', 925_000, 1116],
  ['A', 900_000, 950],
  ['A直前', 899_999, 949],
  ['BBB', 800_000, 475],
  ['BBB直前', 799_999, 474],
  ['C', 500_000, 0],
  ['C未満', 499_999, 0],
]

for (const [name, score, expected] of cases) {
  test(`単曲レーティングをランク境界で計算すること: ${name}`, () => {
    // Given: 譜面定数14.5と境界付近のスコア
    const chartConstant = 14.5

    // When
    const actual = calculateSingleRatingHundredths(score, chartConstant)

    // Then
    assert.equal(actual, expected)
  })
}

test('譜面定数5.0以下ではBBB未満のスコアの単曲レーティングを0にすること', () => {
  // Given: 定数補正が0以下になる低定数
  const score = 850_000

  // When
  const actual = calculateSingleRatingHundredths(score, 5)

  // Then
  assert.equal(actual, 0)
})

test('計算結果が負になる場合は単曲レーティングを0にすること', () => {
  // Given: Aランクの補正(-5.0)が定数を上回る低定数
  const score = 900_000

  // When
  const actual = calculateSingleRatingHundredths(score, 1)

  // Then
  assert.equal(actual, 0)
})

test('浮動小数の誤差を含む譜面定数を0.1単位へ丸めて計算すること', () => {
  // Given: 10倍すると102.99999999999999になり、切り捨てでは10.2として扱われてしまう定数
  const chartConstant = 10.2 + 0.1

  // When
  const actual = calculateSingleRatingHundredths(1_007_500, chartConstant)

  // Then: 10.3 + 2.0
  assert.equal(actual, 1230)
})
