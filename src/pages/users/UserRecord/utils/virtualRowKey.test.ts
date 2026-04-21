import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'
import { getRecordVirtualRowKey } from './virtualRowKey.ts'

const createRecord = (
  overrides: Partial<PlayerRecordWithSongMeta> = {}
): PlayerRecordWithSongMeta => ({
  is_played: true,
  updated_at: '2026-04-20T00:00:00Z',
  difficulty: 'MASTER',
  id: 'song-1',
  title: 'Alpha',
  artist: 'Artist',
  const: 14.5,
  is_const_unknown: false,
  score: 1005000,
  rating: 16.5,
  overpower: 80,
  img: 'image',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  genre: 'POPS & ANIME',
  release: '2024-01-01',
  release_version: 'VERSE',
  ...overrides,
})

test('同一インデックスでもデータ順序が変わればキーも追従する', () => {
  const before = [
    createRecord({ id: 'song-a', difficulty: 'MASTER' }),
    createRecord({ id: 'song-b', difficulty: 'EXPERT' }),
  ]

  const after = [
    createRecord({ id: 'song-b', difficulty: 'EXPERT' }),
    createRecord({ id: 'song-a', difficulty: 'MASTER' }),
  ]

  assert.equal(getRecordVirtualRowKey(before, 0), 'song-a:MASTER')
  assert.equal(getRecordVirtualRowKey(after, 0), 'song-b:EXPERT')
})

test('範囲外インデックスはフォールバックキーを返す', () => {
  assert.equal(getRecordVirtualRowKey([], 5), 'record-row-5')
})
