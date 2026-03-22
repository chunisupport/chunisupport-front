import test from 'node:test'
import assert from 'node:assert/strict'
import { sortWorldsendRecords } from './worldsendRecords.ts'
import type { WorldsendRecordDTO } from '../../../types/api'

const records: WorldsendRecordDTO[] = [
  {
    id: 'played',
    title: 'Played Song',
    artist: 'artist',
    is_played: true,
    updated_at: '2026-03-22T00:00:00Z',
    level_star: 14,
    attribute: 'TECH',
    notes: 1000,
    score: 1000000,
    img: 'played.png',
    clear_lamp: 'CLEAR',
    combo_lamp: null,
    full_chain: null,
  },
  {
    id: 'unplayed',
    title: 'Unplayed Song',
    artist: 'artist',
    is_played: false,
    updated_at: null,
    level_star: 15,
    attribute: 'CHAOS',
    notes: 1200,
    score: 0,
    img: 'unplayed.png',
    clear_lamp: null,
    combo_lamp: null,
    full_chain: null,
  },
]

test("WORLD'S END レコードは未ソート時に未プレイを含む API 順を維持する", () => {
  assert.deepEqual(
    sortWorldsendRecords(records, null, null).map((record) => record.id),
    ['played', 'unplayed']
  )
})

test("WORLD'S END レコードはスコアソート時も未プレイを除外しない", () => {
  const sortedIds = sortWorldsendRecords(records, 'score', 'desc').map((record) => record.id)

  assert.equal(sortedIds.length, 2)
  assert.ok(sortedIds.includes('played'))
  assert.ok(sortedIds.includes('unplayed'))
})
