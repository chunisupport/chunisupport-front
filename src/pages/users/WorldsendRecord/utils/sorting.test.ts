import assert from 'node:assert/strict'
import test from 'node:test'

import type { WorldsendRecordDTO } from '../../../../types/api'
import { sortWorldsendRecords } from './sorting'

/**
 * Test helper to build a WorldsendRecordDTO with default field values.
 *
 * Creates a complete WorldsendRecordDTO object with sensible defaults for all required fields
 * (is_played, updated_at, id, title, artist, level_star, attribute, notes, score, img, clear_lamp,
 * combo_lamp, full_chain), allowing tests to override specific fields as needed.
 *
 * @param overrides - Optional partial object to override default field values
 * @returns A complete WorldsendRecordDTO test object
 */
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
