import assert from 'node:assert/strict'
import test from 'node:test'
import { getPossessionClassName, isPossessionName } from './possession'

for (const name of ['normal', 'silver', 'gold', 'platina', 'rainbow']) {
  test(`ポゼッション名の正規値${name}を受け入れる`, () => {
    // Given: API契約上の正規名称。
    const input = name

    // When: 正規名称か判定する。
    const result = isPossessionName(input)

    // Then: 正規値として受け入れる。
    assert.equal(result, true)
  })
}

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
