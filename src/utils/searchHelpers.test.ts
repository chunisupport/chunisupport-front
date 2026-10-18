import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSearchableItems,
  createSearchTextCache,
  createSearchTextMatcher,
  filterSearchableItems,
} from './searchHelpers'

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
  // Given: 読みがない楽曲と、曲名とは異なる読みが設定済みの楽曲。
  const songs = [undefined, null, '', ' ', '\t\n　'].map((reading) => ({
    title: 'ガッツ・コーヒー',
    artist: '作曲者',
    reading,
  }))
  const searchableSongs = buildSearchableItems([
    ...songs,
    { title: 'ガッツ・コーヒー', artist: '作曲者', reading: 'ソラ' },
  ])

  // When: 曲名の読みだけに一致するクエリで検索する。
  const result = filterSearchableItems(searchableSongs, 'カツツコウヒウ')

  // Then: 読みが空欄の楽曲だけが曲名から補完される。
  assert.deepEqual(result, songs)
})

test('検索用文字列キャッシュは同じ要素を再正規化せず、別の要素は個別に正規化すること', () => {
  // Given
  const getSearchText = createSearchTextCache<{ title: string; artist: string }>()
  const song = { title: 'ＡＢＣ', artist: '作曲者' }
  const replacedSong = { title: 'XYZ', artist: '作曲者' }

  // When
  const first = getSearchText(song)
  const second = getSearchText(song)
  const replaced = getSearchText(replacedSong)

  // Then
  assert.equal(first, second)
  assert.equal(first.normalizedTitle, 'abc')
  assert.equal(replaced.normalizedTitle, 'xyz')
})

test('正規化済み文字列のマッチャーは曲名・アーティスト・読みのいずれかに一致すること', () => {
  // Given
  const getSearchText = createSearchTextCache<{
    title: string
    artist: string
    reading: string | null
  }>()
  const song = getSearchText({ title: '楽曲', artist: 'ABC', reading: 'がっきょく' })

  // When
  const results = ['abc', 'カッキョク', '別曲', ''].map((query) =>
    createSearchTextMatcher(query)(song)
  )

  // Then
  assert.deepEqual(results, [true, true, false, true])
})
