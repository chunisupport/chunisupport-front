import assert from 'node:assert/strict'
import test from 'node:test'
import { getCourseScoreRank } from './courseScoreRank.ts'

for (const { score, expected } of [
  { score: 1499999, expected: 'D' },
  { score: 1500000, expected: 'C' },
  { score: 1799999, expected: 'C' },
  { score: 1800000, expected: 'B' },
  { score: 2099999, expected: 'B' },
  { score: 2100000, expected: 'BB' },
  { score: 2399999, expected: 'BB' },
  { score: 2400000, expected: 'BBB' },
  { score: 2699999, expected: 'BBB' },
  { score: 2700000, expected: 'A' },
  { score: 2774999, expected: 'A' },
  { score: 2775000, expected: 'AA' },
  { score: 2849999, expected: 'AA' },
  { score: 2850000, expected: 'AAA' },
  { score: 2924999, expected: 'AAA' },
  { score: 2925000, expected: 'S' },
  { score: 2969999, expected: 'S' },
  { score: 2970000, expected: 'S+' },
  { score: 2999999, expected: 'S+' },
  { score: 3000000, expected: 'SS' },
  { score: 3014999, expected: 'SS' },
  { score: 3015000, expected: 'SS+' },
  { score: 3022499, expected: 'SS+' },
  { score: 3022500, expected: 'SSS' },
  { score: 3026999, expected: 'SSS' },
  { score: 3027000, expected: 'SSS+' },
]) {
  test(`コーススコア${score}は${expected}と判定すること`, () => {
    // Given: 3曲合計の各ランク境界と、その直前の固定スコア。
    // When
    const rank = getCourseScoreRank(score)

    // Then
    assert.equal(rank, expected)
  })
}

test('コース理論値はSSS+として判定すること', () => {
  // Given: 3曲分の理論値スコア。
  const maxCourseScore = 3_030_000

  // When: コーススコアのランクを判定する。
  const rank = getCourseScoreRank(maxCourseScore)

  // Then: SSS+になる。
  assert.equal(rank, 'SSS+')
})
