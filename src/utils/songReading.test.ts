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

for (const { caseName, reading } of [
  { caseName: 'undefined', reading: undefined },
  { caseName: 'null', reading: null },
  { caseName: '空文字', reading: '' },
  { caseName: '半角空白のみ', reading: ' ' },
  { caseName: 'タブ・改行・全角空白のみ', reading: '\t\n　' },
]) {
  test(`normalizeSongReading は reading が${caseName}の場合に正規化した曲名を使う`, () => {
    // Given
    const song = { title: ' Ｓｋｙ ', reading }

    // When
    const result = normalizeSongReading(song)

    // Then
    assert.equal(result, 'Sky')
  })
}
