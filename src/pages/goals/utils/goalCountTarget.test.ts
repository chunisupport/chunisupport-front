import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildGoalTargetParam,
  getNumberGoalTargetParam,
  resolveGoalDynamicTarget,
} from './goalCountTarget'

/** 固定件数の文字列入力が数値の目標件数へ変換されることを検証する。 */
test('固定件数を数値へ変換して保存する', () => {
  // Given: 5件を目標として入力する。
  const countValue = '5'

  // When: 固定件数の目標値へ変換する。
  const result = buildGoalTargetParam('number', countValue, 'count')

  // Then: 対象譜面数との差分ではなく入力値そのものが使われる。
  assert.deepEqual(result, { count: 5 })
})

/**
 * 全件指定モードの場合に空のパラメータが返されることを検証する。
 *
 * このテストでは、ユーザーが「条件に当てはまるものすべて」を選択した場合の動作を確認する。
 * 全件指定モードでは、入力された件数値に関係なく undefined が返される。
 * 空オブジェクトを返すことで、API側で対象譜面数を動的に適用する仕組みとなる。
 */
test('全件指定の場合は動的上限として空のパラメータを返す', () => {
  // Given: 全件指定を選ぶ。
  const countValue = '5'

  // When: 件数目標値へ変換する。
  const result = buildGoalTargetParam('all', countValue, 'count')

  // Then: 保存値を省略して対象譜面数を動的に使う。
  assert.deepEqual(result, {})
})

test('残数指定の場合はremainingだけを返す', () => {
  // Given
  const targetValue = '3'

  // When
  const result = buildGoalTargetParam('remaining', targetValue, 'total')

  // Then
  assert.deepEqual(result, { remaining: 3 })
})

test('割合指定の場合は小数を維持してpercentだけを返す', () => {
  // Given
  const targetValue = '75.5'

  // When
  const result = buildGoalTargetParam('percent', targetValue, 'count')

  // Then
  assert.deepEqual(result, { percent: 75.5 })
})

test('動的目標値は残数指定を最大値との差分へ変換する', () => {
  // Given
  const params = { remaining: 3 }

  // When
  const result = resolveGoalDynamicTarget(params, 10, 'count')

  // Then
  assert.equal(result, 7)
})

test('動的目標値は割合指定を最大値に対する割合へ変換する', () => {
  // Given
  const params = { percent: 75.5 }

  // When
  const result = resolveGoalDynamicTarget(params, 200, 'total')

  // Then
  assert.equal(result, 151)
})

test('動的目標値は丸め方法を指定できる', () => {
  // Given
  const params = { percent: 50 }

  // When
  const result = resolveGoalDynamicTarget(params, 3, 'count', { rounding: 'ceil' })

  // Then
  assert.equal(result, 2)
})

test('動的目標値はfloor指定で切り捨てる', () => {
  // Given
  const params = { percent: 50 }

  // When
  const result = resolveGoalDynamicTarget(params, 3, 'count', { rounding: 'floor' })

  // Then
  assert.equal(result, 1)
})

test('動的目標値はround指定で四捨五入する', () => {
  // Given
  const params = { percent: 50 }

  // When
  const result = resolveGoalDynamicTarget(params, 5, 'count', { rounding: 'round' })

  // Then
  assert.equal(result, 3)
})

test('数値の成果パラメータをそのまま返す', () => {
  // Given
  const numberParams = { count: 5 }
  const stringParams = { count: '5' }

  // When
  const numberResult = getNumberGoalTargetParam(numberParams, 'count')
  const stringResult = getNumberGoalTargetParam(stringParams, 'count')

  // Then
  assert.equal(numberResult, 5)
  assert.equal(stringResult, 0)
})

test('絶対値指定は最大値より優先される', () => {
  // Given
  const fiveParams = { count: 5 }
  const zeroParams = { count: 0 }

  // When
  const fiveResult = resolveGoalDynamicTarget(fiveParams, 10, 'count')
  const zeroResult = resolveGoalDynamicTarget(zeroParams, 10, 'count')

  // Then
  assert.equal(fiveResult, 5)
  assert.equal(zeroResult, 0)
})
