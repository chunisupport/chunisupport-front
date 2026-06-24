import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordDTO, SongDTO } from '../../types/api'
import {
  buildHighestCurrentRecordBySongId,
  buildOverPowerLockedSongLookup,
  buildTheoreticalTargetRecordBySongId,
} from './overpowerGraph'

const createSong = (overrides: Partial<SongDTO> & Pick<SongDTO, 'id'>): SongDTO => ({
  id: overrides.id,
  title: overrides.title ?? overrides.id,
  reading: overrides.reading ?? null,
  artist: overrides.artist ?? 'artist',
  genre: overrides.genre ?? 'POPS',
  bpm: overrides.bpm ?? null,
  release: overrides.release === undefined ? '2021-11-04' : overrides.release,
  jacket: overrides.jacket ?? null,
  maxop: overrides.maxop ?? 90,
  is_maxop_unknown: overrides.is_maxop_unknown ?? false,
  op_target_difficulty: overrides.op_target_difficulty ?? 'MASTER',
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
  justice_count: overrides.justice_count ?? null,
  overpower_percent: overrides.overpower_percent ?? 100,
  img: overrides.img ?? '',
  clear_lamp: overrides.clear_lamp ?? 'CLEAR',
  combo_lamp: overrides.combo_lamp ?? null,
  full_chain: overrides.full_chain ?? null,
  slot: overrides.slot ?? null,
})

test('ALLグラフは現在OPが高い譜面ではなく理論値最大譜面のレコードを選択する', () => {
  // Given: EXPERTはAJ済みだが、理論値最大のULTIMAは未プレイの楽曲
  const song = createSong({
    id: 'song-a',
    charts: {
      EXPERT: { const: 13, is_const_unknown: false, notes: null },
      MASTER: { const: 14, is_const_unknown: false, notes: null },
      ULTIMA: { const: 15, is_const_unknown: false, notes: null },
    },
  })
  const records = [
    createRecord({
      id: 'song-a',
      difficulty: 'EXPERT',
      combo_lamp: 'ALL JUSTICE',
      overpower: 90,
    }),
    createRecord({ id: 'song-a', difficulty: 'MASTER', combo_lamp: null, overpower: 80 }),
  ]

  // When: ALLグラフ向けに曲ごとの対象レコードを選択する
  const result = buildTheoreticalTargetRecordBySongId(
    [song],
    records,
    buildOverPowerLockedSongLookup([])
  )

  // Then: EXPERTのAJレコードではなく、未プレイのULTIMAとして扱われる
  assert.equal(result.get('song-a'), null)
})

test('ALLグラフはULTIMA未解禁ならMASTERのレコードを理論値最大譜面として選択する', () => {
  // Given: ULTIMA未解禁設定があり、MASTERが利用可能な最大譜面の楽曲
  const song = createSong({
    id: 'song-a',
    charts: {
      MASTER: { const: 14, is_const_unknown: false, notes: null },
      ULTIMA: { const: 15, is_const_unknown: false, notes: null },
    },
  })
  const masterRecord = createRecord({
    id: 'song-a',
    difficulty: 'MASTER',
    combo_lamp: 'ALL JUSTICE',
  })

  // When: ULTIMA未解禁を反映して曲ごとの対象レコードを選択する
  const result = buildTheoreticalTargetRecordBySongId(
    [song],
    [masterRecord],
    buildOverPowerLockedSongLookup([{ display_id: 'song-a', is_ultima: true }])
  )

  // Then: MASTERレコードがALLグラフの集計対象になる
  assert.equal(result.get('song-a'), masterRecord)
})

test('ジャンルとバージョンのグラフ向けに曲ごとの現在OP最大レコードを選択する', () => {
  // Given: 同じ曲に複数難易度のレコードがあり、EXPERTの現在OPが最も高い
  const expertRecord = createRecord({
    id: 'song-a',
    difficulty: 'EXPERT',
    overpower: 90,
    score: 1_009_000,
  })
  const masterRecord = createRecord({
    id: 'song-a',
    difficulty: 'MASTER',
    overpower: 80,
    score: 1_010_000,
  })

  // When: 曲ごとの現在OP最大レコードを選択する
  const result = buildHighestCurrentRecordBySongId([masterRecord, expertRecord])

  // Then: 理論値最大譜面ではなく現在OPが最も高いEXPERTレコードが選ばれる
  assert.equal(result.get('song-a'), expertRecord)
})
