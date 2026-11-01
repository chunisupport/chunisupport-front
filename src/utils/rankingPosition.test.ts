import assert from 'node:assert/strict'
import test from 'node:test'
import { getRankingPositionClass } from './rankingPosition'

test('1位は金メダル色のクラスを返すこと', () => {
  // Given
  const defaultClass = 'bg-surface-hover'

  // When
  const result = getRankingPositionClass(1, defaultClass)

  // Then
  assert.equal(result, 'bg-ranking-gold-bg text-ranking-medal-text')
})

test('2位と3位は銀・銅メダル色のクラスを返すこと', () => {
  // Given
  const defaultClass = 'bg-surface-hover'

  // When & Then
  assert.equal(getRankingPositionClass(2, defaultClass), 'bg-ranking-silver-bg text-ranking-medal-text')
  assert.equal(getRankingPositionClass(3, defaultClass), 'bg-ranking-bronze-bg text-ranking-medal-text')
})

test('4位以降は指定された既定クラスを返すこと', () => {
  // Given
  const defaultClass = 'bg-surface-hover'

  // When & Then
  assert.equal(getRankingPositionClass(4, defaultClass), defaultClass)
  assert.equal(getRankingPositionClass(100, defaultClass), defaultClass)
})

test('順位0や負数はメダル色ではなく既定クラスを返すこと', () => {
  // Given
  const defaultClass = 'bg-surface-hover'

  // When & Then
  assert.equal(getRankingPositionClass(0, defaultClass), defaultClass)
  assert.equal(getRankingPositionClass(-1, defaultClass), defaultClass)
})
