import assert from 'node:assert/strict'
import test from 'node:test'
import { difficultyFrameBackgroundClass, normalizeDifficultyQueryValue } from './difficultyUtils.ts'

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

test('difficultyFrameBackgroundClass は正規化した難易度の枠背景クラスを返すこと', () => {
  // Given: 大文字と小文字の難易度。
  const masterDifficulty = 'MASTER'
  const ultimaDifficulty = 'ultima'

  // When: ジャケット枠用の背景クラスを取得する。
  const masterClass = difficultyFrameBackgroundClass(masterDifficulty)
  const ultimaClass = difficultyFrameBackgroundClass(ultimaDifficulty)

  // Then: MASTERは単色、ULTIMAはストライプ背景になる。
  assert.equal(masterClass, 'bg-difficulty-master-bg')
  assert.match(ultimaClass, /repeating-linear-gradient/)
})

test('difficultyFrameBackgroundClass は未知の難易度を強調枠線色へ落とすこと', () => {
  // Given: ドメイン外の難易度。
  const difficulty = 'WORLDEND'

  // When: ジャケット枠用の背景クラスを取得する。
  const frameClass = difficultyFrameBackgroundClass(difficulty)

  // Then: 未対応難易度用の強調枠線色になる。
  assert.equal(frameClass, 'bg-border-strong')
})

test('normalizeDifficultyQueryValue は未知の難易度を空文字列へ正規化する', () => {
  // Given
  const difficulty = 'worldsend'

  // When
  const normalized = normalizeDifficultyQueryValue(difficulty)

  // Then
  assert.equal(normalized, '')
})
