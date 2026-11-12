import assert from 'node:assert/strict'
import test from 'node:test'
import { getPossessionClassName, isPossessionName, POSSESSION_NAMES } from './possession'

test('ポゼッション名の正規値をすべて受け入れる', () => {
  // Given: APIが返すポゼッション名。

  // When / Then: すべての正規値が判定を通過する。
  for (const name of POSSESSION_NAMES) {
    assert.equal(isPossessionName(name), true)
  }
})

test('未知のポゼッション名は拒否する', () => {
  // Given: マスタに存在しない名称。

  // When / Then: 正規値として扱わない。
  assert.equal(isPossessionName('copper'), false)
  assert.equal(isPossessionName(''), false)
})

for (const [name, expectedClass] of [
  ['silver', 'user-nameplate--colored user-nameplate--silver'],
  ['gold', 'user-nameplate--colored user-nameplate--gold'],
  ['platina', 'user-nameplate--colored user-nameplate--platina'],
  ['rainbow', 'user-nameplate--colored user-nameplate--rainbow'],
]) {
  test(`${name}のポゼッション名を対応する背景クラス名へ変換する`, () => {
    // Given: 着色対象のポゼッション名。

    // When: 背景クラス名へ変換する。
    const result = getPossessionClassName(name)

    // Then: 指定したポゼッション固有の背景クラスを返す。
    assert.equal(result, expectedClass)
  })
}

test('normalと未知のポゼッション名は背景クラス名を付けない', () => {
  // Given: 既定値とマスタに存在しない名称。

  // When / Then: テーマのサーフェス色のままにする。
  assert.equal(getPossessionClassName('normal'), '')
  assert.equal(getPossessionClassName('unknown'), '')
})
