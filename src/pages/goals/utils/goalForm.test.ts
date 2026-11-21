import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveGoalAchievementTypeLabel } from './goalForm'

test('登録済みの目標種別は代替ラベルより登録済みの日本語ラベルを優先して表示する', () => {
  // Given: 表示名が登録されている目標種別と代替ラベル。
  const code = 'fullchain_count'
  const options = { fallbackLabel: '未対応の目標' }

  // When: 代替ラベルを指定して表示名を解決する。
  const result = resolveGoalAchievementTypeLabel(code, options)

  // Then: 代替ラベルやコードではなく登録済みの日本語ラベルを表示する。
  assert.equal(result, 'FULL CHAIN達成数')
})

test('未知の目標種別は代替ラベルの指定がなければコードを表示する', () => {
  // Given: 表示名が登録されていない目標種別。
  const code = 'unknown_goal_type'

  // When: 代替ラベルを指定せずに表示名を解決する。
  const result = resolveGoalAchievementTypeLabel(code)

  // Then: 未知のコードをそのまま表示する。
  assert.equal(result, 'unknown_goal_type')
})

test('未知の目標種別は明示された代替ラベルを表示する', () => {
  // Given: 表示名が登録されていない目標種別と代替ラベル。
  const code = 'unknown_goal_type'
  const options = { fallbackLabel: '未対応の目標' }

  // When: 代替ラベルを指定して表示名を解決する。
  const result = resolveGoalAchievementTypeLabel(code, options)

  // Then: コードではなく代替ラベルを表示する。
  assert.equal(result, '未対応の目標')
})
