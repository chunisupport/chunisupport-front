import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DIFFICULTY_SHORT_NAME_MAP,
  normalizePlayerDataDifficulty,
  PLAYER_DATA_DIFFICULTIES,
  PLAYER_DATA_DIFFICULTY_ORDER,
} from './difficulty.ts'

test('通常譜面の難易度定義は正規順序と略称を一元管理する', () => {
  // Given
  const expectedDifficulties = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA']

  // When
  const difficulties = [...PLAYER_DATA_DIFFICULTIES]

  // Then
  assert.deepEqual(difficulties, expectedDifficulties)
  assert.deepEqual(
    difficulties.map((difficulty) => PLAYER_DATA_DIFFICULTY_ORDER[difficulty]),
    [0, 1, 2, 3, 4]
  )
  assert.deepEqual(
    difficulties.map((difficulty) => DIFFICULTY_SHORT_NAME_MAP[difficulty]),
    ['BAS', 'ADV', 'EXP', 'MAS', 'ULT']
  )
})

test('外部入力の難易度名は大文字へ正規化し、未知の値を除外する', () => {
  // Given
  const lowerCaseDifficulty = ' master '
  const unknownDifficulty = 'WORLDsend'

  // When
  const normalized = normalizePlayerDataDifficulty(lowerCaseDifficulty)
  const unknown = normalizePlayerDataDifficulty(unknownDifficulty)

  // Then
  assert.equal(normalized, 'MASTER')
  assert.equal(unknown, null)
})
