import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeGoalAttributeIds } from './goalAttributes'

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

test('未指定は条件未指定としてundefinedへ正規化される', () => {
  // Given
  const attributeValue = undefined

  // When
  const result = normalizeGoalAttributeIds(attributeValue)

  // Then
  assert.equal(result, undefined)
})

test('空配列は0件条件として空配列を維持する', () => {
  // Given
  const attributeValue: number[] = []

  // When
  const result = normalizeGoalAttributeIds(attributeValue)

  // Then
  assert.deepEqual(result, [])
})
