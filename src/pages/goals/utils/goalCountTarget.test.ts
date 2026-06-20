import assert from 'node:assert/strict'
import test from 'node:test'
import { buildTargetCountParam } from './goalCountTarget'

/**
 * 件数指定モードで入力した値が、反転表示設定に関係なく目標件数として保存されることを検証する。
 *
 * このテストでは、ユーザーが具体的な件数（例: 5件）を入力した場合、
 * その入力値がそのまま目標件数として扱われることを確認する。
 * 反転表示の有無によって値が変換されることなく、入力された数値がそのまま返される。
 */
test('件数を指定した場合は反転表示の有無に関係なく入力値を目標件数として保存する', () => {
  // Given: 5件を目標として入力する。
  const countValue = '5'

  // When: 固定件数の目標値へ変換する。
  const result = buildTargetCountParam('number', countValue)

  // Then: 対象譜面数との差分ではなく入力値そのものが使われる。
  assert.equal(result, 5)
})

/**
 * 全件指定モードの場合に undefined が返されることを検証する。
 *
 * このテストでは、ユーザーが「条件に当てはまるものすべて」を選択した場合の動作を確認する。
 * 全件指定モードでは、入力された件数値に関係なく undefined が返される。
 * undefined を返すことで、API側で対象譜面数を動的に適用する仕組みとなる。
 */
test('全件指定の場合は動的上限としてundefinedを返す', () => {
  // Given: 全件指定を選ぶ。
  const countValue = '5'

  // When: 件数目標値へ変換する。
  const result = buildTargetCountParam('all', countValue)

  // Then: 保存値を省略して対象譜面数を動的に使う。
  assert.equal(result, undefined)
})
