import assert from 'node:assert/strict'
import test from 'node:test'
import type { MasterItemDTO } from '../types/api'
import { resolvePossessionName } from './possession'

const POSSESSIONS: MasterItemDTO[] = [
  { id: 1, name: 'normal' },
  { id: 2, name: 'silver' },
  { id: 3, name: 'gold' },
  { id: 4, name: 'platina' },
  { id: 5, name: 'rainbow' },
]

test('所持状況IDをマスタ名称へ解決する', () => {
  // Given: 虹の所持状況ID。

  // When: マスタから名称を解決する。
  const name = resolvePossessionName(5, POSSESSIONS)

  // Then: 対応するマスタ名称になる。
  assert.equal(name, 'rainbow')
})

test('所持状況IDが未指定の場合はnormalを返す', () => {
  // Given: 旧schemaの最新更新結果など、所持状況IDがない状態。

  // When: 名称を解決する。
  const name = resolvePossessionName(undefined, POSSESSIONS)

  // Then: API省略時と同じ既定値になる。
  assert.equal(name, 'normal')
})

test('マスタに存在しない所持状況IDはnormalを返す', () => {
  // Given: 未知のID、または空のマスタ。

  // When / Then: 表示不能にせず既定値へ落とす。
  assert.equal(resolvePossessionName(99, POSSESSIONS), 'normal')
  assert.equal(resolvePossessionName(5, []), 'normal')
})

test('マスタ名称が正規値でない場合はnormalを返す', () => {
  // Given: 想定外の名称を持つマスタ項目。

  // When: 名称を解決する。
  const name = resolvePossessionName(1, [{ id: 1, name: 'unknown' }])

  // Then: 正規の所持状況名だけを返す。
  assert.equal(name, 'normal')
})
