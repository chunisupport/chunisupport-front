import assert from 'node:assert/strict'
import test from 'node:test'
import { COURSE_TRACK_COUNT, getCourseScoreRank } from './courseScoreRank.ts'
import { SCORE_RANK_MASTER } from './scoreRank.ts'

test('コーススコアは全ランクの通常境界を3倍した値で判定すること', () => {
  // Given: Dを除く全ランクと、その直前のランク。
  const rankBoundaries = SCORE_RANK_MASTER.slice(1).map((definition, index) => ({
    rank: definition.rank,
    previousRank: SCORE_RANK_MASTER[index].rank,
    courseMinScore: definition.minScore * COURSE_TRACK_COUNT,
  }))

  for (const boundary of rankBoundaries) {
    // When: 3倍した境界の直前と境界値でランクを判定する。
    const belowRank = getCourseScoreRank(boundary.courseMinScore - 1)
    const rank = getCourseScoreRank(boundary.courseMinScore)

    // Then: 境界値から次のランクへ切り替わる。
    assert.equal(belowRank, boundary.previousRank)
    assert.equal(rank, boundary.rank)
  }
})

test('コース理論値はSSS+として判定すること', () => {
  // Given: 3曲分の理論値スコア。
  const maxCourseScore = 1_010_000 * COURSE_TRACK_COUNT

  // When: コーススコアのランクを判定する。
  const rank = getCourseScoreRank(maxCourseScore)

  // Then: SSS+になる。
  assert.equal(rank, 'SSS+')
})
