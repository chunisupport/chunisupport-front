import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { WorldsendSongDTO } from '../../../../types/api.ts'
import { nextSortState, sortWorldsendSongs } from './sorting.ts'

const createSong = (overrides: Partial<WorldsendSongDTO>): WorldsendSongDTO => ({
  id: overrides.id ?? 'song',
  title: overrides.title ?? '楽曲',
  reading: overrides.reading ?? null,
  artist: overrides.artist ?? 'アーティスト',
  genre: overrides.genre === undefined ? 'ジャンル' : overrides.genre,
  bpm: overrides.bpm === undefined ? 120 : overrides.bpm,
  release: overrides.release === undefined ? '2024-01-01' : overrides.release,
  official_idx: overrides.official_idx ?? '1',
  jacket: overrides.jacket ?? null,
  charts: overrides.charts ?? {},
})

test("WORLD'S END楽曲一覧のソート状態はascからdesc、最後に解除へ遷移する", () => {
  const first = nextSortState(null, null, 'title')
  const second = nextSortState(first.sortKey, first.sortDirection, 'title')
  const third = nextSortState(second.sortKey, second.sortDirection, 'title')

  assert.deepEqual(first, { sortKey: 'title', sortDirection: 'asc' })
  assert.deepEqual(second, { sortKey: 'title', sortDirection: 'desc' })
  assert.deepEqual(third, { sortKey: null, sortDirection: null })
})

test("WORLD'S END楽曲をタイトルで日本語順にソートする", () => {
  const songs = [
    createSong({ id: 'b', title: 'ウタ' }),
    createSong({ id: 'a', title: 'アイ' }),
    createSong({ id: 'c', title: 'オト' }),
  ]

  assert.deepEqual(
    sortWorldsendSongs(songs, 'title', 'asc').map((song) => song.id),
    ['a', 'b', 'c']
  )
  assert.deepEqual(
    sortWorldsendSongs(songs, 'title', 'desc').map((song) => song.id),
    ['c', 'b', 'a']
  )
})

test("WORLD'S END楽曲のジャンルはマスタのsort_order順にソートする", () => {
  const songs = [
    createSong({ id: 'touhou', genre: '東方Project' }),
    createSong({ id: 'pops', genre: 'POPS & ANIME' }),
    createSong({ id: 'niconico', genre: 'niconico' }),
  ]
  const genres = [
    { id: 1, name: 'POPS & ANIME', sort_order: 10 },
    { id: 2, name: 'niconico', sort_order: 20 },
    { id: 3, name: '東方Project', sort_order: 30 },
  ]

  assert.deepEqual(
    sortWorldsendSongs(songs, 'genre', 'asc', genres).map((song) => song.id),
    ['pops', 'niconico', 'touhou']
  )
  assert.deepEqual(
    sortWorldsendSongs(songs, 'genre', 'desc', genres).map((song) => song.id),
    ['touhou', 'niconico', 'pops']
  )
})

test("WORLD'S END楽曲の属性とレベルの未設定値は末尾に寄せる", () => {
  const songs = [
    createSong({ id: 'missing-chart' }),
    createSong({
      id: 'high',
      charts: { WORLDSEND: { attribute: '狂', level_star: 5, notes: 1000 } },
    }),
    createSong({
      id: 'low',
      charts: { WORLDSEND: { attribute: '改', level_star: 2, notes: 900 } },
    }),
    createSong({
      id: 'missing-level',
      charts: { WORLDSEND: { attribute: '戻', level_star: null, notes: 800 } },
    }),
  ]

  assert.deepEqual(
    sortWorldsendSongs(songs, 'level', 'asc').map((song) => song.id),
    ['low', 'high', 'missing-chart', 'missing-level']
  )
  assert.deepEqual(
    sortWorldsendSongs(songs, 'level', 'desc').map((song) => song.id),
    ['high', 'low', 'missing-chart', 'missing-level']
  )
  assert.deepEqual(
    sortWorldsendSongs(songs, 'attribute', 'asc').map((song) => song.id),
    ['low', 'high', 'missing-level', 'missing-chart']
  )
})
