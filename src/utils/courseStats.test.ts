import assert from 'node:assert/strict'
import test from 'node:test'
import type { CourseStatsBandDTO, RatingBandDTO } from '../types/api'
import {
  COURSE_MAX_SCORE,
  calculateCoursePerTrackAverageScore,
  completeCourseStatsRatingBands,
  findCourseAllStatsBand,
  formatCourseStatsRate,
} from './courseStats.ts'

const ratingBands: RatingBandDTO[] = [
  { id: 2, label: '15.0', min_inclusive: 15, max_exclusive: 15.5, sort_order: 2 },
  { id: 1, label: '-14.9', min_inclusive: null, max_exclusive: 15, sort_order: 1 },
  { id: 3, label: '15.5', min_inclusive: 15.5, max_exclusive: null, sort_order: 3 },
]

test('COURSE_MAX_SCORE が3曲合計の理論値3,030,000であること', () => {
  assert.equal(COURSE_MAX_SCORE, 3_030_000)
})

test('欠落したレーティング帯が0人行で補完され sort_order 順に並ぶこと', () => {
  // Given: 15.0 のみ存在するコース統計。
  const stats: CourseStatsBandDTO[] = [
    {
      rating_band: '15.0',
      combo: { none: 2, fc: 1, aj: 1 },
      clear: { failed: 1, clear: 3 },
      average_score: 2950000,
      median_score: 2960000,
      player_count: 4,
    },
  ]

  // When: マスター定義で欠落帯を補完する。
  const result = completeCourseStatsRatingBands(stats, ratingBands)

  // Then: sort_order 順で3帯が揃い、欠落帯は0人・nullスコアで補完される。
  assert.deepEqual(
    result.map((band) => band.rating_band),
    ['-14.9', '15.0', '15.5']
  )
  assert.equal(result[0].player_count, 0)
  assert.equal(result[0].average_score, null)
  assert.equal(result[1].player_count, 4)
  assert.equal(result[2].clear.clear, 0)
})

test('ALL帯の統計行を取得できること', () => {
  // Given: ALL帯を含む統計一覧。
  const allBand: CourseStatsBandDTO = {
    rating_band: 'ALL',
    combo: { none: 7, fc: 2, aj: 1 },
    clear: { failed: 3, clear: 7 },
    average_score: 2980000,
    median_score: 2990000,
    player_count: 10,
  }

  // When & Then
  assert.equal(findCourseAllStatsBand([allBand]), allBand)
  assert.equal(findCourseAllStatsBand([]), undefined)
})

test('達成率を小数1桁のパーセントへ整形し0人の場合はハイフンを返すこと', () => {
  assert.equal(formatCourseStatsRate(65, 100), '65.0%')
  assert.equal(formatCourseStatsRate(1, 3), '33.3%')
  assert.equal(formatCourseStatsRate(0, 0), '-')
})

test('3曲合計スコアから1曲平均スコアを切り捨て整数で算出できること', () => {
  assert.equal(calculateCoursePerTrackAverageScore(3_030_000), 1_010_000)
  assert.equal(calculateCoursePerTrackAverageScore(3_000_002), 1_000_000)
})
