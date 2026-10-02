import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSearchableItems, filterSearchableItems } from './searchHelpers'

test('楽曲検索はIDだけに含まれる数字・英字に一致しないこと', () => {
  const song = { id: 'abc123', title: '楽曲', artist: '作曲者', reading: 'がっきょく' }
  const searchableSongs = buildSearchableItems([song])

  const results = ['123', 'abc'].map((query) => filterSearchableItems(searchableSongs, query))

  assert.deepEqual(results, [[], []])
})

test('楽曲検索は曲名・アーティスト名に含まれる数字・英字と読みに一致すること', () => {
  const titleMatch = { id: 'first', title: 'Track 123', artist: '作曲者', reading: 'とらっく' }
  const artistMatch = { id: 'second', title: '楽曲', artist: 'ABC', reading: 'がっきょく' }
  const searchableSongs = buildSearchableItems([titleMatch, artistMatch])

  const numberResult = filterSearchableItems(searchableSongs, '123')
  const alphabetResult = filterSearchableItems(searchableSongs, 'AbC')
  const readingResult = filterSearchableItems(searchableSongs, 'ガッキョク')

  assert.deepEqual(numberResult, [titleMatch])
  assert.deepEqual(alphabetResult, [artistMatch])
  assert.deepEqual(readingResult, [artistMatch])
})

test('楽曲検索は曲名とアーティスト名の境界をまたいで一致しないこと', () => {
  const searchableSongs = buildSearchableItems([{ title: 'Track 12', artist: '3ABC' }])

  const result = filterSearchableItems(searchableSongs, '123')

  assert.deepEqual(result, [])
})

test('楽曲検索は読みが空欄でも曲名を読みとして検索できること', () => {
  const song = { title: 'ガッキョク', artist: '作曲者', reading: ' ' }
  const searchableSongs = buildSearchableItems([song])

  const result = filterSearchableItems(searchableSongs, 'かっきょく')

  assert.deepEqual(result, [song])
})
