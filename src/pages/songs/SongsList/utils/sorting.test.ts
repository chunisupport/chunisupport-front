import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { SongDTO } from '../../../../types/api.ts'
import { nextSortState, sortSongs } from './sorting.ts'

const createSong = (overrides: Partial<SongDTO>): SongDTO => ({
  id: overrides.id ?? 'song',
  title: overrides.title ?? '楽曲',
  reading: overrides.reading ?? null,
  name_folder_code: 'NUMBER',
  artist: overrides.artist ?? 'アーティスト',
  genre: overrides.genre ?? 'ジャンル',
  bpm: overrides.bpm === undefined ? 120 : overrides.bpm,
  release: overrides.release === undefined ? '2024-01-01' : overrides.release,
  official_idx: overrides.official_idx,
  jacket: overrides.jacket ?? null,
  maxop: overrides.maxop ?? 0,
  is_maxop_unknown: overrides.is_maxop_unknown ?? false,
  op_target_difficulty: overrides.op_target_difficulty ?? null,
  is_new: overrides.is_new ?? false,
  unlock_required: overrides.unlock_required ?? false,
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

test('タイトル列は reading の日本語順にソートする', () => {
  const songs = [
    createSong({ id: 'b', title: '愛', reading: 'ラブ' }),
    createSong({ id: 'a', title: '空', reading: 'ソラ' }),
    createSong({ id: 'c', title: '林檎', reading: 'リンゴ' }),
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

test('ソートキーまたは方向の片方だけ未設定なら元の順序を保つこと', () => {
  // Given: タイトル順に並んでいない2曲。
  const songs = [
    createSong({ id: 'b', title: '愛', reading: 'ラブ' }),
    createSong({ id: 'a', title: '空', reading: 'ソラ' }),
  ]

  // When: キーのみ・方向のみを指定してソートする。
  const keyOnly = sortSongs(songs, 'title', null)
  const directionOnly = sortSongs(songs, null, 'asc')

  // Then: いずれも元の配列をそのまま返す。
  assert.equal(keyOnly, songs)
  assert.equal(directionOnly, songs)
})

test('追加日降順は新しい順にソートすること', () => {
  // Given: 追加日が異なる3曲を古い順に並べた一覧。
  const songs = [
    createSong({ id: 'old', release: '2023-01-01' }),
    createSong({ id: 'new', release: '2024-06-01' }),
    createSong({ id: 'mid', release: '2023-12-01' }),
  ]

  // When: 追加日で降順ソートする。
  const result = sortSongs(songs, 'release', 'desc')

  // Then: 新しい順に並ぶ。
  assert.deepEqual(
    result.map((song) => song.id),
    ['new', 'mid', 'old']
  )
})

test('ジャンルはマスタのsort_order順にソートし、マスタ外は降順でも末尾に固定する', () => {
  // Given: マスタにある3ジャンルとマスタ外のVARIETYを、期待順と異なる順に並べた楽曲
  const songs = [
    createSong({ id: 'touhou', genre: '東方Project' }),
    createSong({ id: 'pops', genre: 'POPS & ANIME' }),
    createSong({ id: 'niconico', genre: 'niconico' }),
    createSong({ id: 'variety', genre: 'VARIETY' }),
  ]
  // マスタの配列順 (POPS, niconico, 東方)、ID順 (POPS, 東方, niconico)、名前順 (niconico, POPS, 東方) は
  // いずれもsort_order順 (東方, niconico, POPS) と食い違う
  const genres = [
    { id: 1, name: 'POPS & ANIME', sort_order: 30 },
    { id: 3, name: 'niconico', sort_order: 20 },
    { id: 2, name: '東方Project', sort_order: 10 },
  ]

  // When & Then: 昇順・降順ともsort_order順に並び、マスタ外は末尾に残る
  assert.deepEqual(
    sortSongs(songs, 'genre', 'asc', genres).map((song) => song.id),
    ['touhou', 'niconico', 'pops', 'variety']
  )
  assert.deepEqual(
    sortSongs(songs, 'genre', 'desc', genres).map((song) => song.id),
    ['pops', 'niconico', 'touhou', 'variety']
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

test('ノーツ数モードは定数と独立して並び替え、未設定を末尾に保ち同値の順を維持する', () => {
  const songs = [
    createSong({ id: 'missing-chart' }),
    createSong({
      id: 'many',
      charts: { MASTER: { const: 10, is_const_unknown: true, notes: 2000 } },
    }),
    createSong({
      id: 'missing-notes',
      charts: { MASTER: { const: 11, is_const_unknown: false, notes: null } },
    }),
    createSong({
      id: 'few',
      charts: { MASTER: { const: 14, is_const_unknown: false, notes: 900 } },
    }),
    createSong({
      id: 'same',
      charts: { MASTER: { const: 13, is_const_unknown: false, notes: 900 } },
    }),
    createSong({
      id: 'zero',
      charts: { MASTER: { const: 12, is_const_unknown: false, notes: 0 } },
    }),
  ]

  const ascending = sortSongs(songs, 'master', 'asc', undefined, 'notes')
  const descending = sortSongs(songs, 'master', 'desc', undefined, 'notes')
  const constants = sortSongs(songs, 'master', 'asc', undefined, 'const')

  assert.deepEqual(
    ascending.map((song) => song.id),
    ['zero', 'few', 'same', 'many', 'missing-chart', 'missing-notes']
  )
  assert.deepEqual(
    descending.map((song) => song.id),
    ['many', 'few', 'same', 'zero', 'missing-chart', 'missing-notes']
  )
  assert.deepEqual(
    constants.map((song) => song.id),
    ['many', 'missing-notes', 'zero', 'same', 'few', 'missing-chart']
  )
  assert.equal(sortSongs(songs, null, null, undefined, 'notes'), songs)
  assert.equal(songs[0].id, 'missing-chart')
})
