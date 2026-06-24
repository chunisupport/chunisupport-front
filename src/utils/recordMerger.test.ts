import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../types/api.ts'
import { attachSongMetaToRecords } from './recordMerger.ts'

const createSong = (overrides: Partial<SongDTO> = {}): SongDTO => ({
  id: 'song-1',
  title: 'マスタ曲名',
  reading: 'マスタヨミ',
  artist: 'Master Artist',
  genre: 'POPS & ANIME',
  bpm: 180,
  release: '2024-01-01',
  jacket: null,
  maxop: 100,
  is_maxop_unknown: false,
  op_target_difficulty: 'MASTER',
  charts: {
    MASTER: {
      const: 14.5,
      is_const_unknown: false,
      notes: 1000,
    },
  },
  ...overrides,
})

const createRecord = (overrides: Partial<PlayerRecordDTO> = {}): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: true,
  updated_at: '2026-04-20T00:00:00Z',
  difficulty: 'MASTER',
  id: 'song-1',
  title: 'レコード曲名',
  artist: 'Record Artist',
  const: 14.5,
  is_const_unknown: false,
  score: 1005000,
  rating: 16.5,
  overpower: 80,
  justice_count: null,
  overpower_percent: 91.42,
  img: 'image',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

const versions: VersionSummaryDTO[] = [
  {
    name: 'CHUNITHM VERSE',
    released_at: '2024-01-01',
  },
]

test('attachSongMetaToRecords は曲マスタ由来の曲名・アーティスト名・readingを付与する', () => {
  const [record] = attachSongMetaToRecords([createSong()], [createRecord()], versions)

  assert.equal(record.title, 'マスタ曲名')
  assert.equal(record.artist, 'Master Artist')
  assert.equal(record.reading, 'マスタヨミ')
})

test('attachSongMetaToRecords は曲マスタがない場合にレコード由来の曲名・アーティスト名を維持する', () => {
  const [record] = attachSongMetaToRecords([], [createRecord()], versions)

  assert.equal(record.title, 'レコード曲名')
  assert.equal(record.artist, 'Record Artist')
  assert.equal(record.reading, null)
})
