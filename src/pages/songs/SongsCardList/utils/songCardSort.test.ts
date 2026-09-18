import assert from 'node:assert/strict'
import test from 'node:test'
import { SONG_CARD_DEFAULT_SORT_OPTION_ID } from '../constants'
import { findSongCardSortDirectionOption, findSongCardSortOption } from './songCardSort'

test('不明なソートキーIDは標準選択肢へフォールバックすること', () => {
  // Given: 存在しない選択肢 ID。
  const unknownId = 'unknown-key'

  // When: 選択肢を解決する。
  const option = findSongCardSortOption(unknownId)

  // Then: 標準ソートになる。
  assert.equal(option.id, SONG_CARD_DEFAULT_SORT_OPTION_ID)
  assert.equal(option.sortKey, null)
})

test('ソート方向は対応する選択肢を返すこと', () => {
  // Given: 降順。
  // When: 方向選択肢を解決する。
  const option = findSongCardSortDirectionOption('desc')

  // Then: 降順の選択肢になる。
  assert.equal(option.value, 'desc')
})
