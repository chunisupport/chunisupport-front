import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeSongReading } from './songReading.ts'

test('normalizeSongReading は reading を trim して NFKC 正規化する', () => {
  // Given
  const song = { title: '曲', reading: '  ｿﾗ  ' }

  // When
  const result = normalizeSongReading(song)

  // Then
  assert.equal(result, 'ソラ')
})

test('normalizeSongReading は reading が未設定の場合に曲名を使う', () => {
  // Given
  const song = { title: ' Ｓｋｙ ' }

  // When
  const result = normalizeSongReading(song)

  // Then
  assert.equal(result, 'Sky')
})
