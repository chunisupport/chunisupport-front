import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateSingleOverPower } from './singleOverPower'

const cases: [string, number, number, string | null, number][] = [
  ['理論値はランプによらず最大値', 1_010_000, 15.4, null, 92],
  ['SSS+ AJ', 1_009_000, 15, 'ALL JUSTICE', 88.25],
  ['SSS+ FC', 1_009_000, 15, 'FULL COMBO', 87.75],
  ['SSS直前', 1_007_499, 15, null, 84.995],
  ['SSS', 1_007_500, 15, null, 85],
  ['SSS直後は0.005単位で切り捨て', 1_007_501, 15.4, null, 87],
  ['SSSの端数', 1_009_540, 15.4, 'ALL JUSTICE', 91.06],
  ['SS+', 1_005_000, 15, null, 82.5],
  ['SS+直前', 1_004_999, 15, null, 82.495],
  ['SS', 1_000_000, 15, null, 80],
  ['SS直前', 999_999, 15, null, 79.995],
  ['S', 975_000, 15, null, 75],
  ['S FC', 975_000, 15, 'FULL COMBO', 75.5],
  ['S直前は0.05単位で切り捨て', 974_999, 15, null, 74.95],
  ['AAA', 950_000, 15, null, 66.65],
  ['A', 900_000, 15, null, 50],
  ['A直前', 899_999, 15, null, 49.95],
  ['BBB', 800_000, 15, null, 25],
  ['BBB直前', 799_999, 15, null, 24.95],
  ['C', 500_000, 15, null, 0],
  ['D', 400_000, 15, null, 0],
  ['低定数の低スコアは0', 850_000, 4, null, 0],
  ['負のOPは0', 900_000, 4, null, 0],
]

for (const [name, score, constant, lamp, expected] of cases) {
  test(`単曲OP: ${name}`, () => {
    // Given: スコア帯の境界値とコンボランプ。
    // When: 単曲OPを計算する。
    const result = calculateSingleOverPower(score, constant, lamp)
    // Then: APIと同じ補正と切り捨てを適用する。
    assert.equal(result.value, expected)
  })
}

test('OP%は楽曲最大OPではなく対象譜面の理論値で計算する', () => {
  // Given: 定数14のSSS+ AJ記録。
  // When: OP値と達成率を計算する。
  const result = calculateSingleOverPower(1_009_000, 14, 'ALL JUSTICE')
  // Then: 小数点以下5桁で切り捨てる。
  assert.deepEqual(result, { value: 83.25, percent: 97.94117 })
})

test('理論値は100%、定数0は0%とする', () => {
  assert.equal(calculateSingleOverPower(1_010_000, 15.4, 'FULL COMBO').percent, 100)
  assert.equal(calculateSingleOverPower(1_009_000, 0, null).percent, 0)
})
