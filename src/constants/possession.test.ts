import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_POSSESSION_NAME, isPossessionName, POSSESSION_NAMES } from './possession'

test('所持状況名の正規値をすべて受け入れる', () => {
  // Given: APIが返す所持状況名。

  // When / Then: すべての正規値が判定を通過する。
  for (const name of POSSESSION_NAMES) {
    assert.equal(isPossessionName(name), true)
  }
})

test('未知の所持状況名は拒否する', () => {
  // Given: マスタに存在しない名称。

  // When / Then: 正規値として扱わない。
  assert.equal(isPossessionName('copper'), false)
  assert.equal(isPossessionName(''), false)
})

test('未指定時の既定所持状況名はnormalである', () => {
  // Given / When / Then
  assert.equal(DEFAULT_POSSESSION_NAME, 'normal')
})
