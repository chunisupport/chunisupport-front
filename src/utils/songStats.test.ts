import assert from 'node:assert/strict'
import test from 'node:test'
import type { RatingBandDTO, SongStatsBandDTO } from '../types/api'
import { completeSongStatsRatingBands } from './songStats'

/** テスト用の楽曲統計行を生成する。 */
const createStatsBand = (ratingBand: string, playerCount: number): SongStatsBandDTO => ({
  rating_band: ratingBand,
  rank: { aaal: 1, s: 1, sp: 1, ss: 1, ssp: 1, sss: 1, sssp: 1, max: 1 },
  combo: { none: 1, fc: 1, aj: 1, ajc: 1 },
  clear: { failed: 1, clear: 1, hard: 1, brave: 1, absolute: 1, catastrophy: 1 },
  average_score: 1_000_000,
  player_count: playerCount,
})

const ratingBands: RatingBandDTO[] = [
  { id: 2, label: '16.25～16.49', min_inclusive: 16.25, max_exclusive: 16.5, sort_order: 2 },
  { id: 1, label: '16.00～16.24', min_inclusive: 16, max_exclusive: 16.25, sort_order: 1 },
]

test('completeSongStatsRatingBands: 欠落した帯を0人の統計行で補完する', () => {
  // Given: 片方のレーティング帯だけにプレイヤーが存在する。
  const stats = [createStatsBand('16.25～16.49', 3)]

  // When: マスター定義に従って統計行を補完する。
  const result = completeSongStatsRatingBands(stats, ratingBands)

  // Then: 全帯がsort_order順に並び、欠落した帯の値は0になる。
  assert.deepEqual(
    result.map((band) => band.rating_band),
    ['16.00～16.24', '16.25～16.49']
  )
  assert.equal(result[0]?.player_count, 0)
  assert.equal(result[0]?.average_score, null)
  assert.equal(result[0]?.combo.ajc, 0)
  assert.equal(result[0]?.clear.catastrophy, 0)
  assert.equal(result[1], stats[0])
})

test('completeSongStatsRatingBands: 入力配列と既存統計行を変更しない', () => {
  // Given: マスターと統計が逆順で渡される。
  const stats = [createStatsBand('16.25～16.49', 3), createStatsBand('16.00～16.24', 2)]
  const originalRatingBands = [...ratingBands]

  // When: 統計行をマスター順へ並べる。
  const result = completeSongStatsRatingBands(stats, ratingBands)

  // Then: 入力は維持され、既存の統計行がそのまま利用される。
  assert.deepEqual(ratingBands, originalRatingBands)
  assert.equal(result[0], stats[1])
  assert.equal(result[1], stats[0])
})
