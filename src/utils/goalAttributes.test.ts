import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isGoalNameFolderMatched,
  normalizeGoalAttributeValues,
  normalizeGoalDifficultyNames,
  resolveGoalConstSelection,
} from './goalAttributes'

test('単一の識別子は1件の配列へ正規化される', () => {
  // Given
  const attributeValue = 'MASTER'

  // When
  const result = normalizeGoalAttributeValues(attributeValue)

  // Then
  assert.deepEqual(result, ['MASTER'])
})

test('識別子の配列は文字列だけを残して正規化される', () => {
  // Given: DBの数値IDなど文字列以外の値が混入した配列
  const attributeValue = ['A', 4, 'KA'] as unknown as string[]

  // When
  const result = normalizeGoalAttributeValues(attributeValue)

  // Then
  assert.deepEqual(result, ['A', 'KA'])
})

test('未指定は条件未指定としてundefinedへ正規化される', () => {
  // Given
  const attributeValue = undefined

  // When
  const result = normalizeGoalAttributeValues(attributeValue)

  // Then
  assert.equal(result, undefined)
})

test('空配列は0件条件として空配列を維持する', () => {
  // Given
  const attributeValue: string[] = []

  // When
  const result = normalizeGoalAttributeValues(attributeValue)

  // Then
  assert.deepEqual(result, [])
})

test('難易度名はレコードの難易度表記へ正規化され、未知の名前は除かれる', () => {
  // Given
  const difficultyNames = ['master', 'ULTIMA', 'UNKNOWN']

  // When
  const result = normalizeGoalDifficultyNames(difficultyNames)

  // Then
  assert.deepEqual([...result], ['MASTER', 'ULTIMA'])
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

test('入力方法のない目標は保存済みの定数範囲を変えずに数値指定で復元する', () => {
  // Given: 入力方法を保存する前に作成した目標
  const attributes = { const: { min: 13.7, max: 14.2 } }

  // When
  const result = resolveGoalConstSelection(attributes)

  // Then
  assert.deepEqual(result, { constFilterMode: 'number', constRange: { min: 13.7, max: 14.2 } })
})

test('入力方法のない目標はレベル境界と一致する範囲でも数値指定で復元する', () => {
  // Given: 範囲がレベル14と一致するが、入力方法を持たない目標
  const attributes = { const: { min: 14, max: 14.4 } }

  // When
  const result = resolveGoalConstSelection(attributes)

  // Then
  assert.deepEqual(result, { constFilterMode: 'number', constRange: { min: 14, max: 14.4 } })
})

test('定数範囲のない目標は全範囲を数値指定で復元する', () => {
  // Given
  const attributes = { genre: 'POPS & ANIME' }

  // When
  const result = resolveGoalConstSelection(attributes)

  // Then
  assert.deepEqual(result, { constFilterMode: 'number', constRange: { min: 1, max: 16 } })
})

test('レベル指定の目標は範囲がレベル境界と一致すればレベル指定で復元する', () => {
  // Given
  const attributes = { const: { min: 13.5, max: 14.4 }, const_filter_mode: 'level' as const }

  // When
  const result = resolveGoalConstSelection(attributes)

  // Then
  assert.deepEqual(result, { constFilterMode: 'level', constRange: { min: 13.5, max: 14.4 } })
})

test('レベル指定の目標でも範囲がレベル境界と一致しなければ範囲を変えずに数値指定で復元する', () => {
  // Given
  const attributes = { const: { min: 13.7, max: 14.2 }, const_filter_mode: 'level' as const }

  // When
  const result = resolveGoalConstSelection(attributes)

  // Then
  assert.deepEqual(result, { constFilterMode: 'number', constRange: { min: 13.7, max: 14.2 } })
})

test('数値指定の目標はレベル境界と一致する範囲でも数値指定で復元する', () => {
  // Given
  const attributes = { const: { min: 14, max: 14.9 }, const_filter_mode: 'number' as const }

  // When
  const result = resolveGoalConstSelection(attributes)

  // Then
  assert.deepEqual(result, { constFilterMode: 'number', constRange: { min: 14, max: 14.9 } })
})
