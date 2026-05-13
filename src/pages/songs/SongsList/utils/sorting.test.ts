import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { SongDTO } from '../../../../types/api.ts'
import { nextSortState, sortSongs } from './sorting.ts'

const createSong = (overrides: Partial<SongDTO>): SongDTO => ({
  id: overrides.id ?? 'song',
  title: overrides.title ?? '楽曲',
  artist: overrides.artist ?? 'アーティスト',
  genre: overrides.genre ?? 'ジャンル',
  bpm: overrides.bpm === undefined ? 120 : overrides.bpm,
  release: overrides.release === undefined ? '2024-01-01' : overrides.release,
  official_idx: overrides.official_idx,
  jacket: overrides.jacket ?? null,
  maxop: overrides.maxop ?? 0,
  is_maxop_unknown: overrides.is_maxop_unknown ?? false,
  charts: overrides.charts ?? {},
})

test('楽曲一覧のソート状態はascからdesc、最後に解除へ遷移する', () => {
  const first = nextSortState(null, null, 'title')
  const second = nextSortState(first.sortKey, first.sortDirection, 'title')
  const third = nextSortState(second.sortKey, second.sortDirection, 'title')

  assert.deepEqual(first, { sortKey: 'title', sortDirection: 'asc' })
  assert.deepEqual(second, { sortKey: 'title', sortDirection: 'desc' })
  assert.deepEqual(third, { sortKey: null, sortDirection: null })
})

test('タイトルで日本語順にソートする', () => {
  const songs = [
    createSong({ id: 'b', title: 'ウタ' }),
    createSong({ id: 'a', title: 'アイ' }),
    createSong({ id: 'c', title: 'オト' }),
  ]

  assert.deepEqual(
    sortSongs(songs, 'title', 'asc').map((song) => song.id),
    ['a', 'b', 'c']
  )
  assert.deepEqual(
    sortSongs(songs, 'title', 'desc').map((song) => song.id),
    ['c', 'b', 'a']
  )
})

test('ジャンルはマスタのsort_order順にソートする', () => {
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
    sortSongs(songs, 'genre', 'asc', genres).map((song) => song.id),
    ['pops', 'niconico', 'touhou']
  )
  assert.deepEqual(
    sortSongs(songs, 'genre', 'desc', genres).map((song) => song.id),
    ['touhou', 'niconico', 'pops']
  )
})

test('BPMと定数の未設定値は末尾に寄せる', () => {
  const songs = [
    createSong({ id: 'missing-bpm', bpm: null }),
    createSong({ id: 'slow', bpm: 100 }),
    createSong({
      id: 'hard',
      bpm: 180,
      charts: { MASTER: { const: 13.2, is_const_unknown: false, notes: 1000 } },
    }),
    createSong({
      id: 'easy',
      bpm: 140,
      charts: { MASTER: { const: 12.4, is_const_unknown: false, notes: 900 } },
    }),
    createSong({ id: 'missing-chart', bpm: 160 }),
  ]

  assert.deepEqual(
    sortSongs(songs, 'bpm', 'asc').map((song) => song.id),
    ['slow', 'easy', 'missing-chart', 'hard', 'missing-bpm']
  )
  assert.deepEqual(
    sortSongs(songs, 'bpm', 'desc').map((song) => song.id),
    ['hard', 'missing-chart', 'easy', 'slow', 'missing-bpm']
  )
  assert.deepEqual(
    sortSongs(songs, 'master', 'asc').map((song) => song.id),
    ['easy', 'hard', 'missing-bpm', 'slow', 'missing-chart']
  )
  assert.deepEqual(
    sortSongs(songs, 'master', 'desc').map((song) => song.id),
    ['hard', 'easy', 'missing-bpm', 'slow', 'missing-chart']
  )
})
