import assert from 'node:assert/strict'
import test from 'node:test'

import { filterRankToScore, type ScoreRank, scoreToFilterRank } from './scoreRank'

for (const { rank, min, max } of [
  { rank: 'S', min: 975000, max: 989999 },
  { rank: 'S+', min: 990000, max: 999999 },
  { rank: 'SS', min: 1000000, max: 1004999 },
  { rank: 'SS+', min: 1005000, max: 1007499 },
  { rank: 'SSS', min: 1007500, max: 1008999 },
  { rank: 'SSS+', min: 1009000, max: 1010000 },
] as const) {
  test(`${rank}帯の下限と上限のスコアは${rank}へ変換される`, () => {
    // Given: ランク帯の両端のスコア。
    const scores = [min, max]

    // When: フィルター用ランクラベルへ変換する。
    const result = scores.map(scoreToFilterRank)

    // Then: 両端とも指定のランクへ分類される。
    assert.deepEqual(result, [rank, rank])
  })
}

test('filterRankToScore は0点上限を0点として返すこと', () => {
  // Given: 0点ランクの上限を指定する。
  const rank: ScoreRank = '0点'

  // When: 上限スコアへ変換する。
  const result = filterRankToScore(rank, 'max')

  // Then: 次ランクのボーダー未満ではなく0点だけを上限にする。
  assert.equal(result, 0)
})

test('filterRankToScore はAAAの上下限を返すこと', () => {
  // Given: AAAランクを指定する。
  const rank: ScoreRank = 'AAA'

  // When: 下限と上限をスコアへ変換する。
  const min = filterRankToScore(rank, 'min')
  const max = filterRankToScore(rank, 'max')

  // Then: 0点を除くAAA未満を含む範囲になる。
  assert.equal(min, 1)
  assert.equal(max, 974999)
})

test('scoreToFilterRank は0点とAAA帯をランクラベルへ変換すること', () => {
  // Given: 0点とAAA帯の境界値を用意する。
  const zeroScore = 0
  const firstScore = 1
  const belowAaaMinScore = 949999
  const aaaMinScore = 950000
  const aaaMaxScore = 974999

  // When: フィルター用ランクラベルへ変換する。
  const zeroRank = scoreToFilterRank(zeroScore)
  const firstRank = scoreToFilterRank(firstScore)
  const belowAaaMinRank = scoreToFilterRank(belowAaaMinScore)
  const aaaMinRank = scoreToFilterRank(aaaMinScore)
  const aaaMaxRank = scoreToFilterRank(aaaMaxScore)

  // Then: 0点は0点、AAA未満も含めた範囲はAAAとして扱う。
  assert.equal(zeroRank, '0点')
  assert.equal(firstRank, 'AAA')
  assert.equal(belowAaaMinRank, 'AAA')
  assert.equal(aaaMinRank, 'AAA')
  assert.equal(aaaMaxRank, 'AAA')
})
