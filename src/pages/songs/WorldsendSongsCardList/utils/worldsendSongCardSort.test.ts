import assert from 'node:assert/strict'
import test from 'node:test'
import { WORLDSEND_SONG_CARD_DEFAULT_SORT_OPTION_ID } from '../constants'
import {
  findWorldsendSongCardSortDirectionOption,
  findWorldsendSongCardSortOption,
} from './worldsendSongCardSort'

test('不明なソートキーIDは標準選択肢へフォールバックすること', () => {
  // Given: 存在しない選択肢 ID。
  const unknownId = 'unknown-key'

  // When: 選択肢を解決する。
  const option = findWorldsendSongCardSortOption(unknownId)

  // Then: 標準ソートになる。
  assert.equal(option.id, WORLDSEND_SONG_CARD_DEFAULT_SORT_OPTION_ID)
  assert.equal(option.sortKey, null)
})

test('ソート方向は対応する選択肢を返すこと', () => {
  // Given: 降順。
  // When: 方向選択肢を解決する。
  const option = findWorldsendSongCardSortDirectionOption('desc')

  // Then: 降順の選択肢になる。
  assert.equal(option.value, 'desc')
})

for (const { id, expected } of [
  { id: 'default', expected: null },
  { id: 'title', expected: 'title' },
  { id: 'artist', expected: 'artist' },
  { id: 'genre', expected: 'genre' },
  { id: 'release', expected: 'release' },
  { id: 'bpm', expected: 'bpm' },
  { id: 'attribute', expected: 'attribute' },
  { id: 'level', expected: 'level' },
  { id: 'notes', expected: 'notes' },
] as const) {
  test(`ソートID「${id}」は対応するソートキー「${expected ?? '解除'}」を返すこと`, () => {
    // Given: 利用者が選択したソートID。

    // When: IDに対応する選択肢を検索する。
    const option = findWorldsendSongCardSortOption(id)

    // Then: 選択したIDと対応するソートキーを返す。
    assert.equal(option.id, id)
    assert.equal(option.sortKey, expected)
  })
}
