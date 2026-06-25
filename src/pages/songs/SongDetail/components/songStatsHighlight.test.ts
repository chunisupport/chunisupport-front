import assert from 'node:assert/strict'
import test from 'node:test'
import type { RatingBandDTO } from '../../../../types/api'
import { isOwnBestAverageRatingBand } from './songStatsHighlight.ts'

const ratingBands: RatingBandDTO[] = [
  { id: 1, label: '16.00～16.24', min_inclusive: 16, max_exclusive: 16.25, sort_order: 1 },
  { id: 2, label: '16.25～16.49', min_inclusive: 16.25, max_exclusive: 16.5, sort_order: 2 },
  { id: 3, label: '17.00～', min_inclusive: 17, max_exclusive: null, sort_order: 3 },
]

test('ベスト枠平均が統計行のレーティング帯に含まれる場合はハイライト対象になること', () => {
  // Given: ベスト枠平均が16.25以上16.50未満の帯に入る状態。
  const bestAverage = 16.3456

  // When: 該当する統計行か判定する。
  const result = isOwnBestAverageRatingBand('16.25～16.49', bestAverage, ratingBands)

  // Then: 自分の属するレート帯として扱われる。
  assert.equal(result, true)
})

test('ALL行はベスト枠平均が存在してもハイライト対象外になること', () => {
  // Given: ベスト枠平均が任意の帯に入る状態。
  const bestAverage = 16.3456

  // When: ALL行を判定する。
  const result = isOwnBestAverageRatingBand('ALL', bestAverage, ratingBands)

  // Then: ALL行はハイライトされない。
  assert.equal(result, false)
})

test('ベスト枠平均が未計算の場合はハイライト対象外になること', () => {
  // Given: ベスト枠平均がまだ計算されていない状態。
  const bestAverage = null

  // When: 統計行を判定する。
  const result = isOwnBestAverageRatingBand('16.25～16.49', bestAverage, ratingBands)

  // Then: ハイライトされない。
  assert.equal(result, false)
})

test('上限値は次のレーティング帯に含まれること', () => {
  // Given: ひとつ前の帯の上限値と同じベスト枠平均。
  const bestAverage = 16.25

  // When: 前後の統計行を判定する。
  const previousBandResult = isOwnBestAverageRatingBand('16.00～16.24', bestAverage, ratingBands)
  const nextBandResult = isOwnBestAverageRatingBand('16.25～16.49', bestAverage, ratingBands)

  // Then: max_exclusive により次の帯だけがハイライト対象になる。
  assert.equal(previousBandResult, false)
  assert.equal(nextBandResult, true)
})
