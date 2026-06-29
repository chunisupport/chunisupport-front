import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeDifficultyQueryValue } from './difficultyUtils.ts'

test('normalizeDifficultyQueryValue は難易度クエリを大文字のドメイン値へ正規化する', () => {
  // Given: 小文字と大文字の難易度クエリがある。
  const lowerCaseDifficulty = 'master'
  const upperCaseDifficulty = 'ULTIMA'

  // When: 難易度クエリを正規化する。
  const normalizedLowerCase = normalizeDifficultyQueryValue(lowerCaseDifficulty)
  const normalizedUpperCase = normalizeDifficultyQueryValue(upperCaseDifficulty)

  // Then: どちらも大文字のドメイン値として扱われる。
  assert.equal(normalizedLowerCase, 'MASTER')
  assert.equal(normalizedUpperCase, 'ULTIMA')
})

test('normalizeDifficultyQueryValue は配列クエリの先頭値を正規化する', () => {
  // Given: 複数値の難易度クエリがある。
  const difficulty = ['expert', 'master']

  // When: 難易度クエリを正規化する。
  const normalized = normalizeDifficultyQueryValue(difficulty)

  // Then: 先頭値が大文字のドメイン値として扱われる。
  assert.equal(normalized, 'EXPERT')
})
