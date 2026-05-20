import assert from 'node:assert/strict'
import test from 'node:test'

import type { WorldsendRecordDTO } from '../../../../types/api'
import { sortWorldsendRecords } from './sorting'

const createRecord = (overrides: Partial<WorldsendRecordDTO> = {}): WorldsendRecordDTO => ({
  is_played: true,
  updated_at: '2026-04-20T00:00:00Z',
  id: 'song-1',
  title: 'Alpha',
  artist: 'Artist',
  level_star: 15,
  attribute: 'FIRE',
  notes: 1000,
  score: 1005000,
  img: 'image',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  ...overrides,
})

test("WORLD'S ENDのFCHソートはなし、GOLD、PLATINUM、未プレイの順で並べる", () => {
  const records = [
    createRecord({ id: 'none', full_chain: null }),
    createRecord({ id: 'gold', full_chain: 'FULL CHAIN GOLD' }),
    createRecord({ id: 'platinum', full_chain: 'FULL CHAIN PLATINUM' }),
    createRecord({ id: 'unplayed', is_played: false, full_chain: null }),
  ]

  assert.deepEqual(
    sortWorldsendRecords(records, 'fullChain', 'asc').map((record) => record.id),
    ['none', 'gold', 'platinum', 'unplayed']
  )

  assert.deepEqual(
    sortWorldsendRecords(records, 'fullChain', 'desc').map((record) => record.id),
    ['platinum', 'gold', 'none', 'unplayed']
  )
})
