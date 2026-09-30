import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveClassEmblemMasterName } from './classEmblem'

test('マスタIDが対応するマスタ名へ解決されること', () => {
  // Given: 先頭・末尾のマスタID
  // When & Then
  assert.equal(resolveClassEmblemMasterName(1), '1')
  assert.equal(resolveClassEmblemMasterName(6), 'inf')
})

test('未設定または未対応のIDはnullになること', () => {
  // Given: null と範囲外のID
  // When & Then
  assert.equal(resolveClassEmblemMasterName(null), null)
  assert.equal(resolveClassEmblemMasterName(0), null)
  assert.equal(resolveClassEmblemMasterName(7), null)
})
