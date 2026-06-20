import assert from 'node:assert/strict'
import test from 'node:test'
import { buildTargetCountParam } from './goalCountTarget'

test('件数を指定した場合は反転表示の有無に関係なく入力値を目標件数として保存する', () => {
  // Given: 5件を目標として入力する。
  const countValue = '5'

  // When: 固定件数の目標値へ変換する。
  const result = buildTargetCountParam('number', countValue)

  // Then: 対象譜面数との差分ではなく入力値そのものが使われる。
  assert.equal(result, 5)
})

test('全件指定の場合は動的上限としてundefinedを返す', () => {
  // Given: 全件指定を選ぶ。
  const countValue = '5'

  // When: 件数目標値へ変換する。
  const result = buildTargetCountParam('all', countValue)

  // Then: 保存値を省略して対象譜面数を動的に使う。
  assert.equal(result, undefined)
})
