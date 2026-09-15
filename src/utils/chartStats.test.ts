import assert from 'node:assert/strict'
import test from 'node:test'
import type { StandardChartStats } from '../types/chartStats'
import {
  buildChartStatsCumulativeValues,
  buildChartStatsDistribution,
  calculateChartStatsPercent,
  filterChartStatsByTitle,
  paginateChartStats,
} from './chartStats'

/**
 * テスト用の通常譜面統計を生成する。
 *
 * @param title - 曲名。
 * @returns 各カテゴリに境界値を持つ譜面統計。
 */
const createChart = (title = 'テスト楽曲'): StandardChartStats => ({
  song_id: title,
  title,
  const: 14.5,
  is_const_unknown: false,
  player_count: 100,
  rank: { max: 1, sssp: 2, sss: 3, ssp: 4, ss: 5, sp: 6, s: 7, aaal: 72 },
  combo: { ajc: 1, aj: 9, fc: 20, none: 70 },
  clear: { catastrophy: 1, absolute: 2, brave: 3, hard: 4, clear: 50, failed: 40 },
})

test('ランクの排他的件数をグラフ表示順で返すこと', () => {
  // Given
  const chart = createChart()

  // When
  const values = buildChartStatsDistribution(chart, 'rank')

  // Then
  assert.deepEqual(
    values.map(({ label, count }) => [label, count]),
    [
      ['MAX', 1],
      ['SSS+', 2],
      ['SSS', 3],
      ['SS+', 4],
      ['SS', 5],
      ['S+', 6],
      ['S', 7],
      ['～AAA', 72],
    ]
  )
})

test('ランク・コンボ・クリアの累積達成人数を算出すること', () => {
  // Given
  const chart = createChart()

  // When
  const rank = buildChartStatsCumulativeValues(chart, 'rank')
  const combo = buildChartStatsCumulativeValues(chart, 'combo')
  const clear = buildChartStatsCumulativeValues(chart, 'clear')

  // Then
  assert.deepEqual(
    rank.map(({ count }) => count),
    [1, 3, 6, 10, 15, 28]
  )
  assert.deepEqual(
    combo.map(({ count }) => count),
    [1, 10, 30]
  )
  assert.deepEqual(
    clear.map(({ count }) => count),
    [1, 3, 6, 10, 60]
  )
})

test('プレイヤー数が0人の場合は達成率を算出しないこと', () => {
  // Given / When / Then
  assert.equal(calculateChartStatsPercent(25, 100), 25)
  assert.equal(calculateChartStatsPercent(0, 0), null)
})

test('曲名検索を正規化し、結果をページ単位に切り出すこと', () => {
  // Given
  const charts = [createChart('ＡＢＣ song'), createChart('別の曲'), createChart('abc-song 2')]

  // When
  const filtered = filterChartStatsByTitle(charts, 'abc song')
  const secondPage = paginateChartStats(filtered, 2, 1)

  // Then
  assert.deepEqual(
    filtered.map(({ title }) => title),
    ['ＡＢＣ song', 'abc-song 2']
  )
  assert.equal(secondPage[0]?.title, 'abc-song 2')
})

test('50譜面単位で指定ページだけを切り出すこと', () => {
  // Given
  const charts = Array.from({ length: 101 }, (_, index) => createChart(`楽曲${index + 1}`))

  // When
  const secondPage = paginateChartStats(charts, 2, 50)
  const lastPage = paginateChartStats(charts, 3, 50)

  // Then
  assert.equal(secondPage.length, 50)
  assert.equal(secondPage[0]?.title, '楽曲51')
  assert.equal(lastPage.length, 1)
  assert.equal(lastPage[0]?.title, '楽曲101')
})
