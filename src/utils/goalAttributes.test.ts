import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isGoalNameFolderMatched,
  normalizeGoalAttributeIds,
  normalizeGoalNameFolderCodes,
} from './goalAttributes'

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

test('楽曲名順の単一コードは1件のコード配列へ正規化される', () => {
  // Given
  const attributeValue = 'A'

  // When
  const result = normalizeGoalNameFolderCodes(attributeValue)

  // Then
  assert.deepEqual(result, ['A'])
})

test('楽曲名順のコード配列はそのまま返される', () => {
  // Given
  const attributeValue = ['A', 'KA']

  // When
  const result = normalizeGoalNameFolderCodes(attributeValue)

  // Then
  assert.deepEqual(result, ['A', 'KA'])
})

test('楽曲名順の未指定は条件未指定としてundefinedへ正規化される', () => {
  // Given
  const attributeValue = undefined

  // When
  const result = normalizeGoalNameFolderCodes(attributeValue)

  // Then
  assert.equal(result, undefined)
})

test('楽曲名順の条件未指定ならどの楽曲も一致する', () => {
  // Given
  const nameFolderCodes = undefined

  // When
  const result = isGoalNameFolderMatched('A', nameFolderCodes)

  // Then
  assert.equal(result, true)
})

test('楽曲名順の条件に含まれる楽曲だけが一致する', () => {
  // Given
  const nameFolderCodes = ['A', 'KA']

  // When
  const matched = isGoalNameFolderMatched('KA', nameFolderCodes)
  const unmatched = isGoalNameFolderMatched('SA', nameFolderCodes)
  const unresolved = isGoalNameFolderMatched(undefined, nameFolderCodes)

  // Then
  assert.equal(matched, true)
  assert.equal(unmatched, false)
  assert.equal(unresolved, false)
})
