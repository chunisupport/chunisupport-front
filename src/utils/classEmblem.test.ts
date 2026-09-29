import assert from 'node:assert/strict'
import test from 'node:test'
import type { MasterItemDTO } from '../types/api'
import { resolveClassEmblemName } from './classEmblem'

const EMBLEMS: MasterItemDTO[] = [
  { id: 1, name: '1' },
  { id: 6, name: 'inf' },
]

test('クラスエンブレムIDをマスタ名称へ解決する', () => {
  // Given: infのクラスエンブレムID。

  // When: マスタから名称を解決する。
  const name = resolveClassEmblemName(6, EMBLEMS)

  // Then: 対応するマスタ名称になる。
  assert.equal(name, 'inf')
})

test('IDが未設定の場合は undefined を返す', () => {
  // Given: エンブレム未取得のプレイヤー。

  // When: 名称を解決する。
  const name = resolveClassEmblemName(null, EMBLEMS)

  // Then: 何も表示しない。
  assert.equal(name, undefined)
})

test('マスタにないIDは undefined を返す', () => {
  // Given: マスタに存在しないID。

  // When: 名称を解決する。
  const name = resolveClassEmblemName(99, EMBLEMS)

  // Then: 何も表示しない。
  assert.equal(name, undefined)
})
