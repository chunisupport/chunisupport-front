import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { WorldsendSongDTO } from '../../../../types/api.ts'
import { nextSortState, sortWorldsendSongs } from './sorting.ts'

const createSong = (overrides: Partial<WorldsendSongDTO>): WorldsendSongDTO => ({
  id: overrides.id ?? 'song',
  title: overrides.title ?? '楽曲',
  reading: overrides.reading ?? null,
  name_folder_code: 'NUMBER',
  artist: overrides.artist ?? 'アーティスト',
  genre: overrides.genre === undefined ? 'ジャンル' : overrides.genre,
  bpm: overrides.bpm === undefined ? 120 : overrides.bpm,
  release: overrides.release === undefined ? '2024-01-01' : overrides.release,
  official_idx: overrides.official_idx ?? '1',
  jacket: overrides.jacket ?? null,
  is_new: overrides.is_new ?? false,
  unlock_required: overrides.unlock_required ?? false,
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

test("WORLD'S END楽曲を reading の日本語順にソートする", () => {
  const songs = [
    createSong({ id: 'b', title: '愛', reading: 'ラブ' }),
    createSong({ id: 'a', title: '空', reading: 'ソラ' }),
    createSong({ id: 'c', title: '林檎', reading: 'リンゴ' }),
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

test("WORLD'S END楽曲のジャンルはマスタ順にソートし、マスタ外は降順でも末尾に固定する", () => {
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
    sortWorldsendSongs(songs, 'genre', 'asc', genres).map((song) => song.id),
    ['touhou', 'niconico', 'pops', 'variety']
  )
  assert.deepEqual(
    sortWorldsendSongs(songs, 'genre', 'desc', genres).map((song) => song.id),
    ['pops', 'niconico', 'touhou', 'variety']
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

test("WORLD'S END楽曲のノーツ数の未設定値は末尾に寄せる", () => {
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
      id: 'missing-notes',
      charts: { WORLDSEND: { attribute: '戻', level_star: 3, notes: null } },
    }),
  ]

  assert.deepEqual(
    sortWorldsendSongs(songs, 'notes', 'asc').map((song) => song.id),
    ['low', 'high', 'missing-chart', 'missing-notes']
  )
  assert.deepEqual(
    sortWorldsendSongs(songs, 'notes', 'desc').map((song) => song.id),
    ['high', 'low', 'missing-chart', 'missing-notes']
  )
})

test('属性のnull欠損は昇順でも末尾に寄せる', () => {
  // Given: 属性がnullの楽曲と改の楽曲を、欠損が後ろになる入力順で用意する
  const songs = [
    createSong({
      id: 'present',
      charts: { WORLDSEND: { attribute: '改', level_star: 1, notes: 100 } },
    }),
    createSong({
      id: 'missing',
      charts: { WORLDSEND: { attribute: null, level_star: 1, notes: 100 } },
    }),
  ]

  // When: 属性の昇順でソートする
  const result = sortWorldsendSongs(songs, 'attribute', 'asc').map((song) => song.id)

  // Then: null欠損は末尾に寄る
  assert.deepEqual(result, ['present', 'missing'])
})

test('属性の空文字欠損は昇順でも末尾に寄せる', () => {
  // Given: 属性が空文字の楽曲と改の楽曲を、欠損が後ろになる入力順で用意する
  const songs = [
    createSong({
      id: 'present',
      charts: { WORLDSEND: { attribute: '改', level_star: 1, notes: 100 } },
    }),
    createSong({
      id: 'missing',
      charts: { WORLDSEND: { attribute: '', level_star: 1, notes: 100 } },
    }),
  ]

  // When: 属性の昇順でソートする
  const result = sortWorldsendSongs(songs, 'attribute', 'asc').map((song) => song.id)

  // Then: 空文字欠損は末尾に寄る
  assert.deepEqual(result, ['present', 'missing'])
})

test('ソート方向が未指定の場合は入力順を維持する', () => {
  // Given: タイトル順では並んでいない3曲
  const songs = [
    createSong({ id: 'b', title: '愛', reading: 'ラブ' }),
    createSong({ id: 'a', title: '空', reading: 'ソラ' }),
    createSong({ id: 'c', title: '林檎', reading: 'リンゴ' }),
  ]

  // When: ソート方向なしでソートする
  const result = sortWorldsendSongs(songs, 'title', null).map((song) => song.id)

  // Then: 入力順のまま返る
  assert.deepEqual(result, ['b', 'a', 'c'])
})

test('ジャンルの欠損値はマスタ外のジャンルより後に寄せる', () => {
  // Given: マスタ外のVARIETYとジャンルnullの楽曲
  const songs = [
    createSong({ id: 'present', genre: 'VARIETY' }),
    createSong({ id: 'missing', genre: null }),
  ]
  const genres = [{ id: 1, name: 'POPS & ANIME', sort_order: 10 }]

  // When: ジャンルの昇順でソートする
  const result = sortWorldsendSongs(songs, 'genre', 'asc', genres).map((song) => song.id)

  // Then: 欠損値はマスタ外より後ろに寄る
  assert.deepEqual(result, ['present', 'missing'])
})

test('リリース日の降順は新しい順に並び未設定値は末尾に寄せる', () => {
  // Given: 古い日付、新しい日付、未設定をこの順で用意する
  const songs = [
    createSong({ id: 'old', release: '2024-01-01' }),
    createSong({ id: 'new', release: '2024-06-01' }),
    createSong({ id: 'missing', release: null }),
  ]

  // When: リリース日の降順でソートする
  const result = sortWorldsendSongs(songs, 'release', 'desc').map((song) => song.id)

  // Then: 新しい順に並び未設定値は末尾に寄る
  assert.deepEqual(result, ['new', 'old', 'missing'])
})

test('BPMの降順は高い順に並び未設定値は末尾に寄せる', () => {
  // Given: 低いBPM、高いBPM、未設定をこの順で用意する
  const songs = [
    createSong({ id: 'low', bpm: 90 }),
    createSong({ id: 'high', bpm: 180 }),
    createSong({ id: 'missing', bpm: null }),
  ]

  // When: BPMの降順でソートする
  const result = sortWorldsendSongs(songs, 'bpm', 'desc').map((song) => song.id)

  // Then: 高い順に並び未設定値は末尾に寄る
  assert.deepEqual(result, ['high', 'low', 'missing'])
})

test('属性の降順は逆順に並び未設定値は末尾に寄せる', () => {
  // Given: 改、狂、属性nullをこの順で用意する
  const songs = [
    createSong({
      id: 'kae',
      charts: { WORLDSEND: { attribute: '改', level_star: 1, notes: 100 } },
    }),
    createSong({
      id: 'kyou',
      charts: { WORLDSEND: { attribute: '狂', level_star: 1, notes: 100 } },
    }),
    createSong({
      id: 'missing',
      charts: { WORLDSEND: { attribute: null, level_star: 1, notes: 100 } },
    }),
  ]

  // When: 属性の降順でソートする
  const result = sortWorldsendSongs(songs, 'attribute', 'desc').map((song) => song.id)

  // Then: 逆順に並び未設定値は末尾に寄る
  assert.deepEqual(result, ['kyou', 'kae', 'missing'])
})
