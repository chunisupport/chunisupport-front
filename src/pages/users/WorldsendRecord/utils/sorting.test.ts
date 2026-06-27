import assert from 'node:assert/strict'
import test from 'node:test'

import type { WorldsendRecordDTO } from '../../../../types/api'
import {
  createInitialWorldsendRecordSortConditions,
  DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS,
  nextPrimaryWorldsendRecordSortCondition,
  normalizeWorldsendRecordSortConditions,
  sortWorldsendRecords,
  sortWorldsendRecordsByConditions,
} from './sorting'

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
  justice_count: null,
  img: 'image',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  ...overrides,
})

test("WORLD'S ENDの既定ソートはスコア降順、属性昇順、レベル降順、曲名昇順にする", () => {
  assert.deepEqual(DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS, [
    { key: 'score', direction: 'desc' },
    { key: 'attribute', direction: 'asc' },
    { key: 'level', direction: 'desc' },
    { key: 'title', direction: 'asc' },
  ])
})

test("WORLD'S ENDの初期ソートは第1ソートだけクエリ指定で置き換える", () => {
  assert.deepEqual(createInitialWorldsendRecordSortConditions('attribute', 'asc'), [
    { key: 'attribute', direction: 'asc' },
    { key: 'attribute', direction: 'asc' },
    { key: 'level', direction: 'desc' },
    { key: 'title', direction: 'asc' },
  ])
})

test("WORLD'S ENDの第4ソートは入力値に関わらず曲名昇順固定にする", () => {
  assert.deepEqual(
    normalizeWorldsendRecordSortConditions([
      { key: 'level', direction: 'asc' },
      { key: 'attribute', direction: 'desc' },
      { key: 'score', direction: 'desc' },
      { key: 'updatedAt', direction: 'desc' },
    ]),
    [
      { key: 'level', direction: 'asc' },
      { key: 'attribute', direction: 'desc' },
      { key: 'score', direction: 'desc' },
      { key: 'title', direction: 'asc' },
    ]
  )
})

test("WORLD'S ENDの列クリックは第1ソートだけを切り替える", () => {
  assert.deepEqual(
    nextPrimaryWorldsendRecordSortCondition({ key: 'score', direction: 'asc' }, 'score'),
    {
      key: 'score',
      direction: 'desc',
    }
  )
  assert.deepEqual(
    nextPrimaryWorldsendRecordSortCondition({ key: 'score', direction: 'desc' }, 'score'),
    {
      key: 'score',
      direction: 'asc',
    }
  )
  assert.deepEqual(nextPrimaryWorldsendRecordSortCondition(null, 'title'), {
    key: 'title',
    direction: 'asc',
  })
})

test("WORLD'S ENDの複数ソートは前の条件が同値の場合に次の条件で並べる", () => {
  const records = [
    createRecord({ id: 'fire-low', score: 1009000, attribute: 'FIRE', level_star: 2 }),
    createRecord({ id: 'fire-high', score: 1009000, attribute: 'FIRE', level_star: 4 }),
    createRecord({ id: 'air', score: 1009000, attribute: 'AIR', level_star: 1 }),
    createRecord({ id: 'score-high', score: 1010000, attribute: 'FIRE', level_star: 1 }),
  ]

  assert.deepEqual(
    sortWorldsendRecordsByConditions(records, DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS).map(
      (record) => record.id
    ),
    ['score-high', 'air', 'fire-high', 'fire-low']
  )
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

test("WORLD'S ENDのJ数ソートはJ数なし行をスコア降順で並べ、未プレイを末尾に寄せる", () => {
  const records = [
    createRecord({ id: 'aj-j2', combo_lamp: 'ALL JUSTICE', justice_count: 2, score: 1008000 }),
    createRecord({ id: 'fc-high', combo_lamp: 'FULL COMBO', score: 1009500 }),
    createRecord({ id: 'aj-null', combo_lamp: 'ALL JUSTICE', justice_count: null, score: 1009000 }),
    createRecord({ id: 'none-low', combo_lamp: null, score: 1007000 }),
    createRecord({ id: 'aj-j0', combo_lamp: 'ALL JUSTICE', justice_count: 0, score: 1010000 }),
    createRecord({ id: 'unplayed', is_played: false, combo_lamp: null, score: 0 }),
  ]

  assert.deepEqual(
    sortWorldsendRecords(records, 'justiceCount', 'asc').map((record) => record.id),
    ['aj-j0', 'aj-j2', 'fc-high', 'aj-null', 'none-low', 'unplayed']
  )

  assert.deepEqual(
    sortWorldsendRecords(records, 'justiceCount', 'desc').map((record) => record.id),
    ['aj-j2', 'aj-j0', 'fc-high', 'aj-null', 'none-low', 'unplayed']
  )
})
