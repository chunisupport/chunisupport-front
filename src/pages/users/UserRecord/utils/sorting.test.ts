import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger.ts'
import {
  createInitialRecordSortConditions,
  DEFAULT_RECORD_SORT_CONDITIONS,
  nextPrimaryRecordSortCondition,
  normalizeRecordSortConditions,
  parseSortParams,
  sortRecords,
  sortRecordsByConditions,
} from './sorting.ts'

const createRecord = (
  overrides: Partial<PlayerRecordWithSongMeta> = {}
): PlayerRecordWithSongMeta => {
  const record: PlayerRecordWithSongMeta = {
    is_played: true,
    is_op_target: true,
    updated_at: '2026-04-20T00:00:00Z',
    difficulty: 'MASTER',
    id: 'song-1',
    title: 'Alpha',
    reading: 'Alpha',
    artist: 'Artist',
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
    genre: 'POPS & ANIME',
    release: '2024-01-01',
    release_version: 'VERSE',
    notes: 1200,
  }
  return Object.assign(record, overrides)
}

test('ソートクエリが有効な場合は指定値をそのまま使う', () => {
  assert.deepEqual(parseSortParams({ sortcol: 'score', sortorder: 'asc' }), {
    initialSortKey: 'score',
    initialSortOrder: 'asc',
  })
})

test('ソートクエリが無効な場合はscore descを既定値にする', () => {
  assert.deepEqual(parseSortParams({ sortcol: 'unknown', sortorder: 'asc' }), {
    initialSortKey: 'score',
    initialSortOrder: 'desc',
  })
  assert.deepEqual(parseSortParams({ sortcol: 'score', sortorder: 'invalid' }), {
    initialSortKey: 'score',
    initialSortOrder: 'desc',
  })
})

test('通常レコードの既定ソートはスコア降順、定数降順、難易度降順、曲名昇順にする', () => {
  assert.deepEqual(DEFAULT_RECORD_SORT_CONDITIONS, [
    { key: 'score', direction: 'desc' },
    { key: 'const', direction: 'desc' },
    { key: 'difficulty', direction: 'desc' },
    { key: 'title', direction: 'asc' },
  ])
})

test('初期ソートは第1ソートだけクエリ指定で置き換える', () => {
  assert.deepEqual(createInitialRecordSortConditions('rating', 'asc'), [
    { key: 'rating', direction: 'asc' },
    { key: 'const', direction: 'desc' },
    { key: 'difficulty', direction: 'desc' },
    { key: 'title', direction: 'asc' },
  ])
})

test('ソート条件は不足分を既定値で補って4条件にする', () => {
  assert.deepEqual(normalizeRecordSortConditions([{ key: 'rating', direction: 'asc' }]), [
    { key: 'rating', direction: 'asc' },
    { key: 'const', direction: 'desc' },
    { key: 'difficulty', direction: 'desc' },
    { key: 'title', direction: 'asc' },
  ])
})

test('第4ソートは入力値に関わらず曲名固定にする', () => {
  assert.deepEqual(
    normalizeRecordSortConditions([
      { key: 'rating', direction: 'asc' },
      { key: 'const', direction: 'desc' },
      { key: 'difficulty', direction: 'desc' },
      { key: 'score', direction: 'asc' },
    ]),
    [
      { key: 'rating', direction: 'asc' },
      { key: 'const', direction: 'desc' },
      { key: 'difficulty', direction: 'desc' },
      { key: 'title', direction: 'asc' },
    ]
  )
})

test('第4ソートは曲名の方向だけ維持できる', () => {
  assert.deepEqual(
    normalizeRecordSortConditions([
      { key: 'score', direction: 'desc' },
      { key: 'const', direction: 'desc' },
      { key: 'difficulty', direction: 'desc' },
      { key: 'title', direction: 'asc' },
    ]),
    [
      { key: 'score', direction: 'desc' },
      { key: 'const', direction: 'desc' },
      { key: 'difficulty', direction: 'desc' },
      { key: 'title', direction: 'asc' },
    ]
  )
})

test('複数ソートは第4ソートまで評価できる', () => {
  const records = [
    createRecord({ id: 'alpha', title: 'Alpha', score: 1000000, const: 14, difficulty: 'MASTER' }),
    createRecord({ id: 'beta', title: 'Beta', score: 1000000, const: 14, difficulty: 'MASTER' }),
  ]

  assert.deepEqual(
    sortRecordsByConditions(records, DEFAULT_RECORD_SORT_CONDITIONS).map((record) => record.id),
    ['beta', 'alpha']
  )
})

test('列クリックの第1ソートはascからdesc、最後にascへ戻る', () => {
  assert.deepEqual(nextPrimaryRecordSortCondition({ key: 'score', direction: 'asc' }, 'score'), {
    key: 'score',
    direction: 'desc',
  })
  assert.deepEqual(nextPrimaryRecordSortCondition({ key: 'score', direction: 'desc' }, 'score'), {
    key: 'score',
    direction: 'asc',
  })
  assert.deepEqual(nextPrimaryRecordSortCondition(null, 'title'), {
    key: 'title',
    direction: 'asc',
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

test('OP%ソートはAPIのOVER POWER達成率で並べ、未プレイを末尾に固定する', () => {
  const records = [
    createRecord({ id: 'played-low-percent', const: 7, overpower: 40, overpower_percent: 30 }),
    createRecord({
      id: 'unplayed',
      is_played: false,
      const: 17,
      overpower: 0,
      overpower_percent: 0,
    }),
    createRecord({ id: 'played-high-percent', const: 17, overpower: 50, overpower_percent: 80 }),
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

test('複数ソートは前の条件が同値の場合に次の条件で並べる', () => {
  const records = [
    createRecord({ id: 'master-low', difficulty: 'MASTER', score: 1000000 }),
    createRecord({ id: 'expert-high', difficulty: 'EXPERT', score: 1009000 }),
    createRecord({ id: 'master-high', difficulty: 'MASTER', score: 1008000 }),
  ]

  assert.deepEqual(
    sortRecordsByConditions(records, [
      { key: 'difficulty', direction: 'asc' },
      { key: 'score', direction: 'desc' },
    ]).map((record) => record.id),
    ['expert-high', 'master-high', 'master-low']
  )
})

test('J数ソートはJ数を基準に並べ、J数なし行は常に末尾に寄せる', () => {
  const records = [
    createRecord({ id: 'aj-j2', combo_lamp: 'ALL JUSTICE', justice_count: 2 }),
    createRecord({ id: 'aj-j1', combo_lamp: 'ALL JUSTICE', justice_count: 1 }),
    createRecord({ id: 'aj-j0', combo_lamp: 'ALL JUSTICE', justice_count: 0 }),
    createRecord({ id: 'aj-null', combo_lamp: 'ALL JUSTICE', justice_count: null }),
    createRecord({ id: 'fc', combo_lamp: 'FULL COMBO', notes: 1000, score: 1009990 }),
    createRecord({ id: 'unplayed', is_played: false, combo_lamp: null, notes: 1000, score: 0 }),
  ]

  assert.deepEqual(
    sortRecords(records, 'justiceCount', 'asc').map((record) => record.id),
    ['aj-j0', 'aj-j1', 'aj-j2', 'fc', 'aj-null', 'unplayed']
  )

  assert.deepEqual(
    sortRecords(records, 'justiceCount', 'desc').map((record) => record.id),
    ['aj-j2', 'aj-j1', 'aj-j0', 'fc', 'aj-null', 'unplayed']
  )
})

test('ランプソートはランプなし、FC、AJ、未プレイの順で並べる', () => {
  const records = [
    createRecord({ id: 'none', combo_lamp: null }),
    createRecord({ id: 'fc', combo_lamp: 'FULL COMBO' }),
    createRecord({ id: 'aj', combo_lamp: 'ALL JUSTICE' }),
    createRecord({ id: 'unplayed', is_played: false, combo_lamp: null }),
  ]

  assert.deepEqual(
    sortRecords(records, 'lamp', 'asc').map((record) => record.id),
    ['none', 'fc', 'aj', 'unplayed']
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

test('FCHソートはなし、GOLD、PLATINUM、未プレイの順で並べる', () => {
  const records = [
    createRecord({ id: 'none', full_chain: null }),
    createRecord({ id: 'gold', full_chain: 'FULL CHAIN GOLD' }),
    createRecord({ id: 'platinum', full_chain: 'FULL CHAIN PLATINUM' }),
    createRecord({ id: 'unplayed', is_played: false, full_chain: null }),
  ]

  assert.deepEqual(
    sortRecords(records, 'fullChain', 'asc').map((record) => record.id),
    ['none', 'gold', 'platinum', 'unplayed']
  )

  assert.deepEqual(
    sortRecords(records, 'fullChain', 'desc').map((record) => record.id),
    ['platinum', 'gold', 'none', 'unplayed']
  )
})
