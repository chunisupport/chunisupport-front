import assert from 'node:assert/strict'
import test from 'node:test'
import { isExplicitEmptyGoalAttribute, normalizeGoalAttributeIds } from './goalAttributes'

test('単一IDは1件のID配列へ正規化される', () => {
  // Given
  const attributeValue = 3

  // When
  const result = normalizeGoalAttributeIds(attributeValue)

  // Then
  assert.deepEqual(result, [3])
})

test('ID配列は整数だけを残して正規化される', () => {
  // Given
  const attributeValue = [1, 2.5, 4]

  // When
  const result = normalizeGoalAttributeIds(attributeValue)

  // Then
  assert.deepEqual(result, [1, 4])
})

test('空配列は明示的な空選択として判定される', () => {
  // Given
  const attributeValue: number[] = []

  // When
  const result = isExplicitEmptyGoalAttribute(attributeValue)

  // Then
  assert.equal(result, true)
})
