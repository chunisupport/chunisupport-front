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

test('normalizeSongReading は null・空文字・空白のみの読みを曲名へフォールバックする', () => {
  // Given: 読みがない楽曲。半角・全角空白や改行も空欄として扱う。
  for (const reading of [undefined, null, '', ' ', '\t\n　']) {
    // When
    const result = normalizeSongReading({ title: ' Ｓｋｙ ', reading })

    // Then: 曲名を正規化して使用する。
    assert.equal(result, 'Sky')
  }
})
