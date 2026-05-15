import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger.ts'
import { nextSortState, parseSortParams, sortRecords } from './sorting.ts'

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

test('ソートクエリが有効な場合は指定値をそのまま使う', () => {
  assert.deepEqual(parseSortParams({ sortcol: 'score', sortorder: 'asc' }), {
    initialSortKey: 'score',
    initialSortOrder: 'asc',
  })
})

test('ソートクエリが無効な場合はrating descを既定値にする', () => {
  assert.deepEqual(parseSortParams({ sortcol: 'unknown', sortorder: 'asc' }), {
    initialSortKey: 'rating',
    initialSortOrder: 'desc',
  })
  assert.deepEqual(parseSortParams({ sortcol: 'score', sortorder: 'invalid' }), {
    initialSortKey: 'rating',
    initialSortOrder: 'desc',
  })
})

test('ソート状態はascからdesc、最後に解除へ遷移する', () => {
  assert.deepEqual(nextSortState('score', 'asc', 'score'), {
    sortKey: 'score',
    sortDirection: 'desc',
  })
  assert.deepEqual(nextSortState('score', 'desc', 'score'), {
    sortKey: null,
    sortDirection: null,
  })
  assert.deepEqual(nextSortState(null, null, 'title'), {
    sortKey: 'title',
    sortDirection: 'asc',
  })
})

test('スコアソートは未プレイを末尾に固定する', () => {
  const records = [
    createRecord({ id: 'played-low', score: 1000000, title: 'Played Low' }),
    createRecord({ id: 'unplayed', is_played: false, score: 0, rating: 0, title: 'Unplayed' }),
    createRecord({ id: 'played-high', score: 1010000, title: 'Played High' }),
  ]

  assert.deepEqual(
    sortRecords(records, 'score', 'asc').map((record) => record.id),
    ['played-low', 'played-high', 'unplayed']
  )
  assert.deepEqual(
    sortRecords(records, 'score', 'desc').map((record) => record.id),
    ['played-high', 'played-low', 'unplayed']
  )
})

test('OPソートは未プレイを末尾に固定する', () => {
  const records = [
    createRecord({ id: 'played-low', overpower: 50.123 }),
    createRecord({ id: 'unplayed', is_played: false, overpower: 0 }),
    createRecord({ id: 'played-high', overpower: 80.456 }),
  ]

  assert.deepEqual(
    sortRecords(records, 'overpower', 'asc').map((record) => record.id),
    ['played-low', 'played-high', 'unplayed']
  )
  assert.deepEqual(
    sortRecords(records, 'overpower', 'desc').map((record) => record.id),
    ['played-high', 'played-low', 'unplayed']
  )
})

test('OP%ソートは最大OPに対する割合で並べ、未プレイを末尾に固定する', () => {
  const records = [
    createRecord({ id: 'played-low-percent', const: 17, overpower: 50 }),
    createRecord({ id: 'unplayed', is_played: false, const: 17, overpower: 0 }),
    createRecord({ id: 'played-high-percent', const: 7, overpower: 40 }),
  ]

  assert.deepEqual(
    sortRecords(records, 'overpowerPercent', 'asc').map((record) => record.id),
    ['played-low-percent', 'played-high-percent', 'unplayed']
  )
  assert.deepEqual(
    sortRecords(records, 'overpowerPercent', 'desc').map((record) => record.id),
    ['played-high-percent', 'played-low-percent', 'unplayed']
  )
})

test('更新日ソートは未プレイと無効日付を末尾に寄せる', () => {
  const records = [
    createRecord({ id: 'older', updated_at: '2026-04-19T00:00:00Z' }),
    createRecord({ id: 'invalid', updated_at: 'invalid-date' }),
    createRecord({ id: 'newer', updated_at: '2026-04-20T00:00:00Z' }),
    createRecord({ id: 'unplayed', is_played: false, updated_at: null }),
  ]

  assert.deepEqual(
    sortRecords(records, 'updatedAt', 'asc').map((record) => record.id),
    ['older', 'newer', 'invalid', 'unplayed']
  )
})

test('同値の並び順は元の順序を維持する', () => {
  const records = [
    createRecord({ id: 'first', title: 'Same' }),
    createRecord({ id: 'second', title: 'Same' }),
  ]

  assert.deepEqual(
    sortRecords(records, 'title', 'asc').map((record) => record.id),
    ['first', 'second']
  )
})

test('J数ソートはJ数を基準に並べ、J数なし行は常に末尾に寄せる', () => {
  const records = [
    createRecord({ id: 'aj-j2', combo_lamp: 'ALL JUSTICE', notes: 1000, score: 1009980 }),
    createRecord({ id: 'aj-j1', combo_lamp: 'ALL JUSTICE', notes: 1000, score: 1009990 }),
    createRecord({ id: 'aj-j0', combo_lamp: 'ALL JUSTICE', notes: null, score: 1010000 }),
    createRecord({ id: 'aj-no-notes', combo_lamp: 'ALL JUSTICE', notes: null, score: 1009990 }),
    createRecord({ id: 'fc', combo_lamp: 'FULL COMBO', notes: 1000, score: 1009990 }),
    createRecord({ id: 'unplayed', is_played: false, combo_lamp: null, notes: 1000, score: 0 }),
  ]

  assert.deepEqual(
    sortRecords(records, 'justiceCount', 'asc').map((record) => record.id),
    ['aj-j0', 'aj-j1', 'aj-j2', 'aj-no-notes', 'fc', 'unplayed']
  )

  assert.deepEqual(
    sortRecords(records, 'justiceCount', 'desc').map((record) => record.id),
    ['aj-j2', 'aj-j1', 'aj-j0', 'aj-no-notes', 'fc', 'unplayed']
  )
})

test('ランプソートは未プレイ、ランプなし、FC、AJの順で並べる', () => {
  const records = [
    createRecord({ id: 'none', combo_lamp: null }),
    createRecord({ id: 'fc', combo_lamp: 'FULL COMBO' }),
    createRecord({ id: 'aj', combo_lamp: 'ALL JUSTICE' }),
    createRecord({ id: 'unplayed', is_played: false, combo_lamp: null }),
  ]

  assert.deepEqual(
    sortRecords(records, 'lamp', 'asc').map((record) => record.id),
    ['unplayed', 'none', 'fc', 'aj']
  )

  assert.deepEqual(
    sortRecords(records, 'lamp', 'desc').map((record) => record.id),
    ['aj', 'fc', 'none', 'unplayed']
  )
})

test('ハードランプソートはCATASTROPHYより後ろにFAILEDを並べる', () => {
  const records = [
    createRecord({ id: 'clear', clear_lamp: 'CLEAR' }),
    createRecord({ id: 'hard', clear_lamp: 'HARD' }),
    createRecord({ id: 'brave', clear_lamp: 'BRAVE' }),
    createRecord({ id: 'absolute', clear_lamp: 'ABSOLUTE' }),
    createRecord({ id: 'catastrophy', clear_lamp: 'CATASTROPHY' }),
    createRecord({ id: 'failed', clear_lamp: 'FAILED' }),
    createRecord({ id: 'none', clear_lamp: null }),
    createRecord({ id: 'unplayed', is_played: false, clear_lamp: null }),
  ]

  assert.deepEqual(
    sortRecords(records, 'hardLamp', 'asc').map((record) => record.id),
    ['failed', 'clear', 'hard', 'brave', 'absolute', 'catastrophy', 'none', 'unplayed']
  )

  assert.deepEqual(
    sortRecords(records, 'hardLamp', 'desc').map((record) => record.id),
    ['catastrophy', 'absolute', 'brave', 'hard', 'clear', 'failed', 'none', 'unplayed']
  )
})
