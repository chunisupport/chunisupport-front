import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizePlayerDataDifficulty } from './difficulty.ts'

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
