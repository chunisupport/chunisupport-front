import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_POSSESSION_NAME,
  getPossessionClassName,
  isPossessionName,
  POSSESSION_CLASS_NAMES,
  POSSESSION_NAMES,
} from './possession'

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

test('未指定時の既定ポゼッション名はnormalである', () => {
  // Given / When / Then
  assert.equal(DEFAULT_POSSESSION_NAME, 'normal')
})

test('着色するポゼッション名をプロフィールカード背景のCSSクラス名へ変換する', () => {
  // Given: normal 以外の正規ポゼッション名。

  // When / Then: 着色クラスと個別クラスを返す。
  for (const name of POSSESSION_NAMES) {
    if (name === DEFAULT_POSSESSION_NAME) continue
    assert.equal(
      getPossessionClassName(name),
      `user-nameplate--colored ${POSSESSION_CLASS_NAMES[name]}`
    )
  }
})

test('normalと未知のポゼッション名は背景クラス名を付けない', () => {
  // Given: 既定値とマスタに存在しない名称。

  // When / Then: テーマのサーフェス色のままにする。
  assert.equal(getPossessionClassName('normal'), '')
  assert.equal(getPossessionClassName('unknown'), '')
})
