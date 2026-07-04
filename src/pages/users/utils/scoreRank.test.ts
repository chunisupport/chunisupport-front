import assert from 'node:assert/strict'
import test from 'node:test'

import { filterRankToScore, SCORE_RANKS, type ScoreRank, scoreToFilterRank } from './scoreRank'

test('SCORE_RANKS は0点とAAA以上のランクを昇順で返すこと', () => {
  // Given: スコアランクフィルターの選択肢を参照する。
  const expected: ScoreRank[] = ['0点', 'AAA', 'S', 'S+', 'SS', 'SS+', 'SSS', 'SSS+']

  // When: 選択肢を取得する。
  const result = SCORE_RANKS

  // Then: AAAを含む期待順で返る。
  assert.deepEqual(result, expected)
})

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

  // Then: AAAのスコア範囲になる。
  assert.equal(min, 950000)
  assert.equal(max, 974999)
})

test('scoreToFilterRank は0点とAAA帯をランクラベルへ変換すること', () => {
  // Given: 0点とAAA帯の境界値を用意する。
  const zeroScore = 0
  const aaaMinScore = 950000
  const aaaMaxScore = 974999

  // When: フィルター用ランクラベルへ変換する。
  const zeroRank = scoreToFilterRank(zeroScore)
  const aaaMinRank = scoreToFilterRank(aaaMinScore)
  const aaaMaxRank = scoreToFilterRank(aaaMaxScore)

  // Then: 0点は0点、AAA帯はAAAとして扱う。
  assert.equal(zeroRank, '0点')
  assert.equal(aaaMinRank, 'AAA')
  assert.equal(aaaMaxRank, 'AAA')
})
