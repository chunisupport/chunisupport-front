import assert from 'node:assert/strict'
import test from 'node:test'
import type { StandardChartStats, WorldsendChartStats } from '../types/chartStats'
import {
  buildChartStatsCumulativeValues,
  buildChartStatsDistribution,
  buildChartStatsTableValues,
  calculateChartStatsBarWidthPercent,
  calculateChartStatsPercent,
  filterChartStatsByTitle,
  getMaxChartStatsPlayerCount,
  sortChartStats,
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
    rank.map(({ label }) => label),
    ['MAX', 'SSS+', 'SSS', 'SS+', 'SS', 'S+', 'S']
  )
  assert.deepEqual(
    rank.map(({ count }) => count),
    [1, 3, 6, 10, 15, 21, 28]
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

test('表の集計値は累積指定で累積人数を返すこと', () => {
  // Given
  const chart = createChart()

  // When
  const rank = buildChartStatsTableValues(chart, 'rank', true)

  // Then
  assert.deepEqual(
    rank.map(({ count }) => count),
    [1, 3, 6, 10, 15, 21, 28]
  )
})

test('表の集計値は非累積指定で区分ごとの排他人数を返すこと', () => {
  // Given
  const chart = createChart()

  // When
  const rank = buildChartStatsTableValues(chart, 'rank', false)
  const combo = buildChartStatsTableValues(chart, 'combo', false)
  const clear = buildChartStatsTableValues(chart, 'clear', false)

  // Then
  assert.deepEqual(
    rank.map(({ count }) => count),
    [1, 2, 3, 4, 5, 6, 7, 72]
  )
  assert.deepEqual(
    combo.map(({ count }) => count),
    [1, 9, 20, 70]
  )
  assert.deepEqual(
    clear.map(({ count }) => count),
    [1, 2, 3, 4, 50, 40]
  )
})

test('指標列のソートは累積と排他で評価値を使い分けること', () => {
  // Given: SSS累積は mid=60 > low=6、SSS排他は low=3 < mid=30
  const charts = [
    createSortableChart({
      title: 'chart-mid',
      rank: { max: 10, sssp: 20, sss: 30, ssp: 0, ss: 0, sp: 0, s: 0, aaal: 40 },
    }),
    createSortableChart({
      title: 'chart-low',
      rank: { max: 1, sssp: 2, sss: 3, ssp: 0, ss: 0, sp: 0, s: 0, aaal: 94 },
    }),
  ]

  // When
  const cumulative = sortChartStats(charts, 'sss', 'asc', 'rank', true)
  const exclusive = sortChartStats(charts, 'aaal', 'asc', 'rank', false)

  // Then
  assert.deepEqual(
    cumulative.map(({ title }) => title),
    ['chart-low', 'chart-mid']
  )
  assert.deepEqual(
    exclusive.map(({ title }) => title),
    ['chart-mid', 'chart-low']
  )
})

test('表示中の最大プレイ人数を取得すること', () => {
  // Given
  const charts = [
    createSortableChart({ title: 'few', player_count: 50 }),
    createSortableChart({ title: 'many', player_count: 300 }),
    createSortableChart({ title: 'mid', player_count: 100 }),
  ]

  // When
  const max = getMaxChartStatsPlayerCount(charts)

  // Then
  assert.equal(max, 300)
})

test('空配列の最大プレイ人数は0になること', () => {
  // Given / When / Then
  assert.equal(getMaxChartStatsPlayerCount([]), 0)
})

test('最大プレイ人数に対するバー幅を人数比で算出すること', () => {
  // Given / When / Then
  assert.equal(calculateChartStatsBarWidthPercent(300, 300), 100)
  assert.equal(calculateChartStatsBarWidthPercent(150, 300), 50)
  assert.equal(calculateChartStatsBarWidthPercent(0, 300), 0)
})

test('基準人数が0以下の場合のバー幅は0になること', () => {
  // Given / When / Then
  assert.equal(calculateChartStatsBarWidthPercent(100, 0), 0)
})

test('曲名検索を正規化して絞り込むこと', () => {
  // Given
  const charts = [createChart('ＡＢＣ song'), createChart('別の曲'), createChart('abc-song 2')]

  // When
  const filtered = filterChartStatsByTitle(charts, 'abc song')

  // Then
  assert.deepEqual(
    filtered.map(({ title }) => title),
    ['ＡＢＣ song', 'abc-song 2']
  )
})

/**
 * ソート検証用の通常譜面統計を生成する。
 *
 * @param overrides - 上書きするフィールド。曲名は必須。
 * @returns 既定値へ上書きを適用した通常譜面統計。
 */
const createSortableChart = (
  overrides: Partial<StandardChartStats> & Pick<StandardChartStats, 'title'>
): StandardChartStats => ({
  ...createChart(overrides.title),
  ...overrides,
})

/**
 * ソート検証用のWORLD'S END譜面統計を生成する。
 *
 * @param title - 曲名。
 * @param levelStar - 星数。欠損の場合はnull。
 * @param attribute - 属性。欠損の場合はnull。
 * @returns 固定の分布値を持つWORLD'S END譜面統計。
 */
const createSortableWorldsendChart = (
  title: string,
  levelStar: number | null,
  attribute: string | null
): WorldsendChartStats => ({
  song_id: title,
  title,
  level_star: levelStar,
  attribute,
  player_count: 100,
  rank: { max: 1, sssp: 2, sss: 3, ssp: 4, ss: 5, sp: 6, s: 7, aaal: 72 },
  combo: { ajc: 1, aj: 9, fc: 20, none: 70 },
  clear: { catastrophy: 1, absolute: 2, brave: 3, hard: 4, clear: 50, failed: 40 },
})

test('曲名の昇順と降順に並べ替えること', () => {
  // Given
  const charts = [
    createSortableChart({ title: 'C song' }),
    createSortableChart({ title: 'A song' }),
    createSortableChart({ title: 'B song' }),
  ]

  // When
  const ascending = sortChartStats(charts, 'title', 'asc', 'rank')
  const descending = sortChartStats(charts, 'title', 'desc', 'rank')

  // Then
  assert.deepEqual(
    ascending.map(({ title }) => title),
    ['A song', 'B song', 'C song']
  )
  assert.deepEqual(
    descending.map(({ title }) => title),
    ['C song', 'B song', 'A song']
  )
})

test('定数の昇順と降順に並べ替えること', () => {
  // Given
  const charts = [
    createSortableChart({ title: 'low', const: 13.0 }),
    createSortableChart({ title: 'high', const: 15.0 }),
    createSortableChart({ title: 'mid', const: 14.5 }),
  ]

  // When
  const ascending = sortChartStats(charts, 'level', 'asc', 'rank')
  const descending = sortChartStats(charts, 'level', 'desc', 'rank')

  // Then
  assert.deepEqual(
    ascending.map(({ title }) => title),
    ['low', 'mid', 'high']
  )
  assert.deepEqual(
    descending.map(({ title }) => title),
    ['high', 'mid', 'low']
  )
})

test('人数の昇順と降順に並べ替えること', () => {
  // Given
  const charts = [
    createSortableChart({ title: 'many', player_count: 300 }),
    createSortableChart({ title: 'few', player_count: 50 }),
    createSortableChart({ title: 'mid', player_count: 100 }),
  ]

  // When
  const ascending = sortChartStats(charts, 'player_count', 'asc', 'rank')
  const descending = sortChartStats(charts, 'player_count', 'desc', 'rank')

  // Then
  assert.deepEqual(
    ascending.map(({ title }) => title),
    ['few', 'mid', 'many']
  )
  assert.deepEqual(
    descending.map(({ title }) => title),
    ['many', 'mid', 'few']
  )
})

test('累積指標の人数で並べ替えること', () => {
  // Given: SSS累積は chart-low=6、chart-mid=60、chart-high=600
  const charts = [
    createSortableChart({
      title: 'chart-mid',
      rank: { max: 10, sssp: 20, sss: 30, ssp: 0, ss: 0, sp: 0, s: 0, aaal: 40 },
    }),
    createSortableChart({
      title: 'chart-high',
      rank: { max: 100, sssp: 200, sss: 300, ssp: 0, ss: 0, sp: 0, s: 0, aaal: 400 },
    }),
    createSortableChart({
      title: 'chart-low',
      rank: { max: 1, sssp: 2, sss: 3, ssp: 0, ss: 0, sp: 0, s: 0, aaal: 94 },
    }),
  ]

  // When
  const ascending = sortChartStats(charts, 'sss', 'asc', 'rank')

  // Then
  assert.deepEqual(
    ascending.map(({ title }) => title),
    ['chart-low', 'chart-mid', 'chart-high']
  )
})

test('WORLD’S ENDは星数と属性の順に並べ欠損を末尾に回すこと', () => {
  // Given
  const charts = [
    createSortableWorldsendChart('unknown-star', null, 'カ'),
    createSortableWorldsendChart('star5-b', 5, 'カ'),
    createSortableWorldsendChart('star3-b', 3, 'カ'),
    createSortableWorldsendChart('star5-a', 5, 'ア'),
    createSortableWorldsendChart('star3-a', 3, 'ア'),
  ]

  // When
  const ascending = sortChartStats(charts, 'level', 'asc', 'rank')
  const descending = sortChartStats(charts, 'level', 'desc', 'rank')

  // Then
  assert.deepEqual(
    ascending.map(({ title }) => title),
    ['star3-a', 'star3-b', 'star5-a', 'star5-b', 'unknown-star']
  )
  assert.deepEqual(
    descending.map(({ title }) => title),
    ['star5-b', 'star5-a', 'star3-b', 'star3-a', 'unknown-star']
  )
})

test('ソート未指定時は元の順序を保った複製を返すこと', () => {
  // Given
  const charts = [
    createSortableChart({ title: 'B song' }),
    createSortableChart({ title: 'A song' }),
  ]

  // When
  const unsorted = sortChartStats(charts, null, null, 'rank')

  // Then
  assert.deepEqual(
    unsorted.map(({ title }) => title),
    ['B song', 'A song']
  )
  assert.notEqual(unsorted, charts)
})

test('同順時は曲名順で確定すること', () => {
  // Given
  const charts = [
    createSortableChart({ title: 'B song', player_count: 100 }),
    createSortableChart({ title: 'A song', player_count: 100 }),
  ]

  // When
  const sorted = sortChartStats(charts, 'player_count', 'desc', 'rank')

  // Then
  assert.deepEqual(
    sorted.map(({ title }) => title),
    ['A song', 'B song']
  )
})
