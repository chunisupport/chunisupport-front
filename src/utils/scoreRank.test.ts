import assert from 'node:assert/strict'
import test from 'node:test'
import { getScoreRank, SCORE_RANK_MASTER } from './scoreRank'

for (const { rank, minScore } of SCORE_RANK_MASTER) {
  test(`ランク下限ちょうどのスコアは${rank}になること`, () => {
    // Given: ランクの下限スコア
    // When
    const actual = getScoreRank(minScore)

    // Then
    assert.equal(actual, rank)
  })
}

for (const [score, expected] of [
  [1_008_999, 'SSS'],
  [1_007_499, 'SS+'],
  [999_999, 'S+'],
  [974_999, 'AAA'],
  [899_999, 'BBB'],
  [499_999, 'D'],
] as const) {
  test(`境界直前のスコア${score}は下位の${expected}になること`, () => {
    // Given: ランク境界の1点下
    // When
    const actual = getScoreRank(score)

    // Then
    assert.equal(actual, expected)
  })
}

test('範囲外のスコアは0〜理論値へ丸めてランクを判定すること', () => {
  // Given: 負のスコアと理論値超過のスコア
  // When & Then
  assert.equal(getScoreRank(-1), 'D')
  assert.equal(getScoreRank(1_010_001), 'SSS+')
})
