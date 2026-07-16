import assert from 'node:assert/strict'
import test from 'node:test'
import { getRankingPositionClass } from './rankingPosition.ts'

test('上位3位は順位に対応する共通メダル色を返す', () => {
  // Given: 上位3位の順位。
  const ranks = [1, 2, 3]

  // When: 各順位の表示クラスを取得する。
  const results = ranks.map((rank) => getRankingPositionClass(rank, 'default-class'))

  // Then: 金、銀、銅の順に共通メダル色が返る。
  assert.deepEqual(results, [
    'bg-ranking-gold-bg text-ranking-medal-text',
    'bg-ranking-silver-bg text-ranking-medal-text',
    'bg-ranking-bronze-bg text-ranking-medal-text',
  ])
})

test('4位以下は呼び出し元が指定した既定クラスを返す', () => {
  // Given: メダル対象外の順位と既定クラス。
  const rank = 4
  const defaultClass = 'bg-surface-muted text-text-muted'

  // When: 順位の表示クラスを取得する。
  const result = getRankingPositionClass(rank, defaultClass)

  // Then: 指定した既定クラスが返る。
  assert.equal(result, defaultClass)
})
