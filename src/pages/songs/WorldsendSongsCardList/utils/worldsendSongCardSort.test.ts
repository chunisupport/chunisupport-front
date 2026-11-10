import assert from 'node:assert/strict'
import test from 'node:test'
import {
  WORLDSEND_SONG_CARD_DEFAULT_SORT_OPTION_ID,
  WORLDSEND_SONG_CARD_SORT_OPTIONS,
} from '../constants'
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

test("WORLD'S ENDカードソート選択肢は属性・レベル・ノーツを含むこと", () => {
  // Given: カード一覧のソート選択肢。
  const optionIds = WORLDSEND_SONG_CARD_SORT_OPTIONS.map((option) => option.id)

  // When: 初期選択肢と譜面キーを確認する。
  const defaultOption = WORLDSEND_SONG_CARD_SORT_OPTIONS.find(
    (option) => option.id === WORLDSEND_SONG_CARD_DEFAULT_SORT_OPTION_ID
  )

  // Then: 標準はソート解除、属性・レベル・ノーツを選べる。
  assert.equal(defaultOption?.sortKey, null)
  assert.equal(optionIds.includes('attribute'), true)
  assert.equal(optionIds.includes('level'), true)
  assert.equal(optionIds.includes('notes'), true)
  assert.equal(WORLDSEND_SONG_CARD_SORT_OPTIONS.length, 9)
})
