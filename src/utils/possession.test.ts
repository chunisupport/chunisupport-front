import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizePossessionName } from './possession'

test('正規のポゼッション名はそのまま返す', () => {
  // Given: APIが返す虹のポゼッション名。

  // When: 名称を正規化する。
  const name = normalizePossessionName('rainbow')

  // Then: 同じ名称になる。
  assert.equal(name, 'rainbow')
})

test('ポゼッション名が未指定の場合はnormalを返す', () => {
  // Given: プレイヤー未連携など、ポゼッション名がない状態。

  // When / Then: API省略時と同じ既定値になる。
  assert.equal(normalizePossessionName(undefined), 'normal')
  assert.equal(normalizePossessionName(null), 'normal')
})

test('正規値でないポゼッション名はnormalを返す', () => {
  // Given: 想定外の名称。

  // When: 名称を正規化する。
  const name = normalizePossessionName('unknown')

  // Then: 表示不能にせず既定値へ落とす。
  assert.equal(name, 'normal')
})
