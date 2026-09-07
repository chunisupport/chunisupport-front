import assert from 'node:assert/strict'
import test from 'node:test'
import { createSongFilters, filterSongs } from './songFilters'

const versions = [
  { name: 'CHUNITHM', released_at: '2015-07-16' },
  { name: 'CHUNITHM PLUS', released_at: '2016-02-04' },
]
const songs = [
  { genre: 'A', bpm: 150, release: '2015-07-16' },
  { genre: 'B', bpm: 180.5, release: '2016-02-03T00:00:00+09:00' },
  { genre: 'C', bpm: 200, release: '2016-02-04' },
  { genre: 'A', bpm: null, release: null },
]

test('未指定では不明値も含め元の順序ですべて返す', () => {
  assert.deepEqual(filterSongs(songs, createSongFilters(), versions), songs)
})

test('BPMの上下限を含み、不明値を除外する', () => {
  const filters = { ...createSongFilters(), bpmMin: '150', bpmMax: '180.5' }
  assert.deepEqual(filterSongs(songs, filters, versions), songs.slice(0, 2))
})

test('片側だけのBPM範囲も適用する', () => {
  assert.deepEqual(filterSongs(songs, { ...createSongFilters(), bpmMax: '150' }, versions), [
    songs[0],
  ])
  assert.deepEqual(filterSongs(songs, { ...createSongFilters(), bpmMin: '200' }, versions), [
    songs[2],
  ])
})

test('追加日の両端を含み、時刻に影響されず不明値を除外する', () => {
  const filters = { ...createSongFilters(), releaseMin: '2015-07-16', releaseMax: '2016-02-03' }
  assert.deepEqual(filterSongs(songs, filters, versions), songs.slice(0, 2))
})

test('バージョン稼働日の前日と当日を分ける', () => {
  assert.deepEqual(
    filterSongs(songs, { ...createSongFilters(), versions: ['CHUNITHM'] }, versions),
    songs.slice(0, 2)
  )
  assert.deepEqual(
    filterSongs(songs, { ...createSongFilters(), versions: ['CHUNITHM PLUS'] }, versions),
    [songs[2]]
  )
})

test('ジャンルとバージョン内はOR、異なる条件間はANDで絞る', () => {
  const filters = {
    ...createSongFilters(),
    genres: ['A', 'B'],
    versions: ['CHUNITHM', 'CHUNITHM PLUS'],
    bpmMin: '160',
  }
  assert.deepEqual(filterSongs(songs, filters, versions), [songs[1]])
})

test('逆転した範囲では該当なしとなる', () => {
  assert.deepEqual(
    filterSongs(songs, { ...createSongFilters(), bpmMin: '200', bpmMax: '150' }, versions),
    []
  )
  assert.deepEqual(
    filterSongs(
      songs,
      { ...createSongFilters(), releaseMin: '2016-02-04', releaseMax: '2015-07-16' },
      versions
    ),
    []
  )
})

test('リセット用の初期状態は全選択を表す', () => {
  const filters = createSongFilters()
  filters.genres = ['A']
  assert.equal(createSongFilters().genres, null)
})

test('WORLD’S ENDのジャンル不明値は条件指定時だけ除外する', () => {
  const unknown = [{ genre: null, bpm: 150, release: '2015-07-16' }]
  assert.deepEqual(filterSongs(unknown, createSongFilters(), versions), unknown)
  assert.deepEqual(filterSongs(unknown, { ...createSongFilters(), genres: ['A'] }, versions), [])
})

test('すべて解除したジャンルまたはバージョンでは該当なしとなる', () => {
  assert.deepEqual(filterSongs(songs, { ...createSongFilters(), genres: [] }, versions), [])
  assert.deepEqual(filterSongs(songs, { ...createSongFilters(), versions: [] }, versions), [])
})
