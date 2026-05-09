import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../types/api'
import { buildOverPowerSummary } from './overpowerSummary'

const versions: VersionSummaryDTO[] = [
  { name: 'CHUNITHM', released_at: '2015-07-16' },
  { name: 'CHUNITHM NEW', released_at: '2021-11-04' },
  { name: 'CHUNITHM VERSE', released_at: '2024-12-12' },
]

const createSong = (overrides: Partial<SongDTO> & Pick<SongDTO, 'id'>): SongDTO => ({
  id: overrides.id,
  title: overrides.title ?? overrides.id,
  artist: overrides.artist ?? 'artist',
  genre: overrides.genre ?? 'POPS',
  bpm: overrides.bpm ?? null,
  release: overrides.release === undefined ? '2021-11-04' : overrides.release,
  jacket: overrides.jacket ?? null,
  maxop: overrides.maxop ?? 90,
  is_maxop_unknown: overrides.is_maxop_unknown ?? false,
  charts: overrides.charts ?? {
    MASTER: {
      const: 15,
      is_const_unknown: false,
      notes: null,
    },
  },
})

const createRecord = (
  overrides: Partial<PlayerRecordDTO> & Pick<PlayerRecordDTO, 'id'>
): PlayerRecordDTO => ({
  is_played: overrides.is_played ?? true,
  updated_at: overrides.updated_at ?? null,
  difficulty: overrides.difficulty ?? 'MASTER',
  id: overrides.id,
  title: overrides.title ?? overrides.id,
  artist: overrides.artist ?? 'artist',
  const: overrides.const ?? 15,
  is_const_unknown: overrides.is_const_unknown ?? false,
  score: overrides.score ?? 1_010_000,
  rating: overrides.rating ?? 17,
  overpower: overrides.overpower ?? 90,
  img: overrides.img ?? '',
  clear_lamp: overrides.clear_lamp ?? 'CLEAR',
  combo_lamp: overrides.combo_lamp ?? null,
  full_chain: overrides.full_chain ?? null,
  slot: overrides.slot ?? null,
})

test('ALLは曲ごとの最大record.overpowerとsong.maxopを1回ずつ集計する', () => {
  const summary = buildOverPowerSummary(
    [createSong({ id: 'song-a', maxop: 90 }), createSong({ id: 'song-b', maxop: 80 })],
    [
      createRecord({ id: 'song-a', difficulty: 'EXPERT', overpower: 70 }),
      createRecord({ id: 'song-a', difficulty: 'MASTER', overpower: 85 }),
      createRecord({ id: 'song-b', is_played: false, overpower: 0 }),
    ],
    versions
  )

  assert.equal(summary.all.current, 85)
  assert.equal(summary.all.max, 170)
  assert.equal(summary.all.count, 2)
  assert.equal(summary.all.percent, 50)
})

test('ジャンル不明とバージョン不明はALLに含め、各内訳から除外する', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({ id: 'known', genre: 'niconico', release: '2024-12-12', maxop: 90 }),
      createSong({ id: 'unknown', genre: '不明', release: null, maxop: 80 }),
    ],
    [createRecord({ id: 'known', overpower: 60 }), createRecord({ id: 'unknown', overpower: 40 })],
    versions
  )

  assert.equal(summary.all.current, 100)
  assert.deepEqual(
    summary.genres.map((row) => row.label),
    ['niconico']
  )
  assert.deepEqual(
    summary.versions.map((row) => row.label),
    ['VERSE']
  )
})

test('バージョン別はリリース日順で並ぶ', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({ id: 'verse', release: '2024-12-12', maxop: 90 }),
      createSong({ id: 'new', release: '2021-11-04', maxop: 80 }),
    ],
    [createRecord({ id: 'verse', overpower: 80 }), createRecord({ id: 'new', overpower: 70 })],
    versions
  )

  assert.deepEqual(
    summary.versions.map((row) => row.label),
    ['NEW', 'VERSE']
  )
})

test('レベル別は最高譜面定数を表示レベルへ変換し、10未満を判定する', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({
        id: 'low',
        maxop: 62.5,
        charts: { MASTER: { const: 9.5, is_const_unknown: false, notes: null } },
      }),
      createSong({
        id: 'high',
        maxop: 87,
        charts: { MASTER: { const: 14.4, is_const_unknown: false, notes: null } },
      }),
    ],
    [createRecord({ id: 'low', overpower: 10 }), createRecord({ id: 'high', overpower: 80 })],
    versions
  )

  assert.deepEqual(
    summary.levels.map((row) => [row.label, row.isLowLevel]),
    [
      ['9+', true],
      ['14', false],
    ]
  )
})

test('曲マスタにnull譜面が含まれていてもレベル別集計で落ちない', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({
        id: 'nullable-chart',
        maxop: 87.5,
        charts: {
          BASIC: null,
          MASTER: { const: 14.5, is_const_unknown: false, notes: null },
        } as unknown as SongDTO['charts'],
      }),
    ],
    [createRecord({ id: 'nullable-chart', overpower: 80 })],
    versions
  )

  assert.deepEqual(
    summary.levels.map((row) => row.label),
    ['14+']
  )
})

test('難易度別は譜面単位で現在値と理論値を集計する', () => {
  const summary = buildOverPowerSummary(
    [createSong({ id: 'song-a' })],
    [
      createRecord({ id: 'song-a', difficulty: 'BASIC', const: 2, overpower: 20 }),
      createRecord({ id: 'song-a', difficulty: 'MASTER', const: 15, overpower: 85 }),
    ],
    versions
  )

  assert.deepEqual(
    summary.difficulties.map((row) => [row.label, row.current, row.max, row.count]),
    [
      ['BASIC', 20, 25, 1],
      ['MASTER', 85, 90, 1],
    ]
  )
})

test('通常未解禁楽曲は曲単位と譜面単位の集計から除外する', () => {
  const summary = buildOverPowerSummary(
    [createSong({ id: 'locked', maxop: 90 }), createSong({ id: 'available', maxop: 80 })],
    [
      createRecord({ id: 'locked', difficulty: 'MASTER', overpower: 85 }),
      createRecord({ id: 'available', difficulty: 'MASTER', overpower: 70, const: 13 }),
    ],
    versions,
    [{ display_id: 'locked', is_ultima: false }]
  )

  assert.equal(summary.all.current, 70)
  assert.equal(summary.all.max, 80)
  assert.equal(summary.all.count, 1)
  assert.deepEqual(
    summary.difficulties.map((row) => [row.label, row.current, row.max, row.count]),
    [['MASTER', 70, 80, 1]]
  )
})

test('ULTIMA未解禁はULTIMA譜面だけを集計から除外する', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({
        id: 'song-a',
        maxop: 95,
        charts: {
          MASTER: { const: 14, is_const_unknown: false, notes: null },
          ULTIMA: { const: 16, is_const_unknown: false, notes: null },
        },
      }),
    ],
    [
      createRecord({ id: 'song-a', difficulty: 'MASTER', overpower: 80, const: 14 }),
      createRecord({ id: 'song-a', difficulty: 'ULTIMA', overpower: 92, const: 16 }),
    ],
    versions,
    [{ display_id: 'song-a', is_ultima: true }]
  )

  assert.equal(summary.all.current, 80)
  assert.equal(summary.all.max, 85)
  assert.deepEqual(
    summary.levels.map((row) => row.label),
    ['14']
  )
  assert.deepEqual(
    summary.difficulties.map((row) => row.label),
    ['MASTER']
  )
})
