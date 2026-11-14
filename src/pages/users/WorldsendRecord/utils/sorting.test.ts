import assert from 'node:assert/strict'
import test from 'node:test'

import type { WorldsendRecordDTO } from '../../../../types/api'
import { createInitialSortConditions } from '../../../../utils/sortConditions'
import {
  DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS,
  normalizeWorldsendRecordSortConditions,
  parseWorldsendSortParams,
  sortWorldsendRecords,
  sortWorldsendRecordsByConditions,
} from './sorting'

/**
 * 必須フィールドに既定値を入れたテスト用の WORLD'S END レコードを生成する。
 *
 * @param overrides - 既定値から上書きするフィールド。
 * @returns テスト用の WORLD'S END レコード。
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

test("WORLD'S ENDの不正な sortcol はスコア降順に戻し、登録済み列は指定ソートを使う", () => {
  // Given
  const invalidSortCols = ['toString', 'constructor', '__proto__', 'not-a-column'] as const

  for (const sortcol of invalidSortCols) {
    // When: 継承プロパティ、または未登録の列名を指定する
    const result = parseWorldsendSortParams({ sortcol, sortorder: 'asc' })

    // Then
    assert.deepEqual(result, {
      initialSortKey: 'score',
      initialSortOrder: 'desc',
    })
    assert.equal(typeof result.initialSortKey, 'string')
  }

  assert.deepEqual(parseWorldsendSortParams({ sortcol: 'updated_at', sortorder: 'asc' }), {
    initialSortKey: 'updatedAt',
    initialSortOrder: 'asc',
  })
})

test("WORLD'S ENDの初期ソートは第1ソートをクエリ指定にし、重複キーを既定条件で補完する", () => {
  // Given
  const sortKey = 'attribute'
  const sortDirection = 'asc'
  const expectedSortConditions = [
    { key: 'attribute', direction: 'asc' },
    { key: 'score', direction: 'desc' },
    { key: 'level', direction: 'desc' },
    { key: 'title', direction: 'asc' },
  ]

  // When
  const result = createInitialSortConditions(
    sortKey,
    sortDirection,
    DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS
  )

  // Then
  assert.deepEqual(result, expectedSortConditions)
})

test("WORLD'S ENDの第4ソートは入力値に関わらず曲名昇順固定にする", () => {
  // Given
  const sortConditions = [
    { key: 'level', direction: 'asc' },
    { key: 'attribute', direction: 'desc' },
    { key: 'score', direction: 'desc' },
    { key: 'updatedAt', direction: 'desc' },
  ] as const
  const expectedSortConditions = [
    { key: 'level', direction: 'asc' },
    { key: 'attribute', direction: 'desc' },
    { key: 'score', direction: 'desc' },
    { key: 'title', direction: 'asc' },
  ]

  // When
  const result = normalizeWorldsendRecordSortConditions([...sortConditions])

  // Then
  assert.deepEqual(result, expectedSortConditions)
})

test("WORLD'S ENDの複数ソートは前の条件が同値の場合に次の条件で並べる", () => {
  // Given
  const records = [
    createRecord({ id: 'fire-low', score: 1009000, attribute: 'FIRE', level_star: 2 }),
    createRecord({
      id: 'fire-high-z',
      title: 'Zulu',
      score: 1009000,
      attribute: 'FIRE',
      level_star: 4,
    }),
    createRecord({
      id: 'fire-high-a',
      title: 'Alpha',
      score: 1009000,
      attribute: 'FIRE',
      level_star: 4,
    }),
    createRecord({ id: 'air', score: 1009000, attribute: 'AIR', level_star: 1 }),
    createRecord({ id: 'score-high', score: 1010000, attribute: 'FIRE', level_star: 1 }),
  ]

  // When
  const result = sortWorldsendRecordsByConditions(
    records,
    DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS
  ).map((record) => record.id)

  // Then
  assert.deepEqual(result, ['score-high', 'air', 'fire-high-a', 'fire-high-z', 'fire-low'])
})

test("WORLD'S ENDのスコアソートは昇順でも未プレイを末尾に寄せる", () => {
  const records = [
    createRecord({ id: 'played-zero', score: 0 }),
    createRecord({ id: 'unplayed', is_played: false, score: 0 }),
    createRecord({ id: 'played-high', score: 1010000 }),
  ]

  assert.deepEqual(
    sortWorldsendRecords(records, 'score', 'asc').map((record) => record.id),
    ['played-zero', 'played-high', 'unplayed']
  )
  assert.deepEqual(
    sortWorldsendRecords(records, 'score', 'desc').map((record) => record.id),
    ['played-high', 'played-zero', 'unplayed']
  )
})

test("WORLD'S ENDの第4ソートは曲名指定でも方向を昇順へ固定する", () => {
  // Given
  const sortConditions = [
    { key: 'score', direction: 'desc' },
    { key: 'attribute', direction: 'asc' },
    { key: 'level', direction: 'desc' },
    { key: 'title', direction: 'desc' },
  ] as const
  const expectedSortConditions = [
    { key: 'score', direction: 'desc' },
    { key: 'attribute', direction: 'asc' },
    { key: 'level', direction: 'desc' },
    { key: 'title', direction: 'asc' },
  ]

  // When
  const result = normalizeWorldsendRecordSortConditions([...sortConditions])

  // Then
  assert.deepEqual(result, expectedSortConditions)
})

for (const input of ['1条件', '重複条件'] as const) {
  test(`WORLD'S ENDのソート条件は${input}から重複を除いて4条件に補う`, () => {
    // Given
    const sortConditions =
      input === '1条件'
        ? [{ key: 'level', direction: 'asc' } as const]
        : [
            { key: 'level', direction: 'asc' } as const,
            { key: 'level', direction: 'desc' } as const,
          ]
    const expectedSortConditions = [
      { key: 'level', direction: 'asc' },
      { key: 'score', direction: 'desc' },
      { key: 'attribute', direction: 'asc' },
      { key: 'title', direction: 'asc' },
    ]

    // When
    const result = normalizeWorldsendRecordSortConditions([...sortConditions])

    // Then
    assert.deepEqual(result, expectedSortConditions)
  })
}

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

test("WORLD'S ENDのランプソートはランプなし、FC、AJ、AJC、未プレイの順で並べる", () => {
  const records = [
    createRecord({ id: 'none', combo_lamp: null }),
    createRecord({ id: 'fc', combo_lamp: 'FULL COMBO' }),
    createRecord({ id: 'aj', combo_lamp: 'ALL JUSTICE', score: 1009999 }),
    createRecord({ id: 'ajc', combo_lamp: 'ALL JUSTICE', score: 1010000 }),
    createRecord({ id: 'unplayed', is_played: false, combo_lamp: null }),
  ]

  assert.deepEqual(
    sortWorldsendRecords(records, 'lamp', 'asc').map((record) => record.id),
    ['none', 'fc', 'aj', 'ajc', 'unplayed']
  )

  assert.deepEqual(
    sortWorldsendRecords(records, 'lamp', 'desc').map((record) => record.id),
    ['ajc', 'aj', 'fc', 'none', 'unplayed']
  )
})

test("WORLD'S ENDの単一J数ソートは数値順に並べ、J数なし行の入力順を維持する", () => {
  // Given: J数あり・欠落・未プレイの行。
  const records = [
    createRecord({ id: 'aj-j2', combo_lamp: 'ALL JUSTICE', justice_count: 2, score: 1008000 }),
    createRecord({ id: 'aj-null', combo_lamp: 'ALL JUSTICE', justice_count: null, score: 1009000 }),
    createRecord({ id: 'none-low', combo_lamp: null, score: 1007000 }),
    createRecord({ id: 'fc-high', combo_lamp: 'FULL COMBO', score: 1009500 }),
    createRecord({ id: 'aj-j0', combo_lamp: 'ALL JUSTICE', justice_count: 0, score: 1010000 }),
    createRecord({ id: 'unplayed', is_played: false, combo_lamp: null, score: 0 }),
  ]

  // When / Then: 単一条件で並べると、J数なしの4件は入力順のまま末尾へ残る。
  assert.deepEqual(
    sortWorldsendRecords(records, 'justiceCount', 'asc').map((record) => record.id),
    ['aj-j0', 'aj-j2', 'aj-null', 'none-low', 'fc-high', 'unplayed']
  )

  assert.deepEqual(
    sortWorldsendRecords(records, 'justiceCount', 'desc').map((record) => record.id),
    ['aj-j2', 'aj-j0', 'aj-null', 'none-low', 'fc-high', 'unplayed']
  )
})

for (const direction of ['asc', 'desc'] as const) {
  test(`WORLD'S ENDのJ数${direction}ソートは欠損行同士を後続のスコア降順で並べる`, () => {
    // Given: 欠損行がスコア昇順で入力されている。
    const records = [
      createRecord({ id: 'none-low', combo_lamp: null, score: 1007000 }),
      createRecord({ id: 'aj-j2', combo_lamp: 'ALL JUSTICE', justice_count: 2, score: 1008000 }),
      createRecord({
        id: 'aj-null',
        combo_lamp: 'ALL JUSTICE',
        justice_count: null,
        score: 1009000,
      }),
      createRecord({ id: 'fc-high', combo_lamp: 'FULL COMBO', score: 1009500 }),
      createRecord({ id: 'aj-j0', combo_lamp: 'ALL JUSTICE', justice_count: 0, score: 1010000 }),
      createRecord({ id: 'unplayed', is_played: false, score: 0 }),
    ]

    // When: J数、スコアの優先順でソートする。
    const result = sortWorldsendRecordsByConditions(records, [
      { key: 'justiceCount', direction },
      { key: 'score', direction: 'desc' },
    ])

    // Then: J数欠損同士の順序は入力順でなくスコアで決まる。
    assert.deepEqual(
      result.map((record) => record.id),
      direction === 'asc'
        ? ['aj-j0', 'aj-j2', 'fc-high', 'aj-null', 'none-low', 'unplayed']
        : ['aj-j2', 'aj-j0', 'fc-high', 'aj-null', 'none-low', 'unplayed']
    )
  })
}

test("WORLD'S ENDの更新日降順は日時なしのプレイ済みを末尾に寄せる", () => {
  // Given: 日時なしと日時ありのプレイ済みレコード。
  const records = [
    createRecord({ id: 'missing', updated_at: null }),
    createRecord({ id: 'valid', updated_at: '2026-04-20T00:00:00Z' }),
  ]

  // When: 更新日降順でソートする。
  const result = sortWorldsendRecords(records, 'updatedAt', 'desc').map((record) => record.id)

  // Then: 日時なしは方向に関わらず末尾に残る。
  assert.deepEqual(result, ['valid', 'missing'])
})

test("WORLD'S ENDの更新日降順は日時あり同士を新しい順に並べる", () => {
  // Given: 更新日が異なるプレイ済みレコード。
  const records = [
    createRecord({ id: 'older', updated_at: '2026-04-10T00:00:00Z' }),
    createRecord({ id: 'newer', updated_at: '2026-04-20T00:00:00Z' }),
  ]

  // When: 更新日降順でソートする。
  const result = sortWorldsendRecords(records, 'updatedAt', 'desc').map((record) => record.id)

  // Then: 新しい順に並ぶ。
  assert.deepEqual(result, ['newer', 'older'])
})

test("WORLD'S ENDの単一ソートは方向未指定なら入力順を維持する", () => {
  // Given: スコア順と異なる入力順のレコード。
  const records = [
    createRecord({ id: 'low', score: 1005000 }),
    createRecord({ id: 'high', score: 1010000 }),
  ]

  // When: 方向を指定せずにスコアでソートする。
  const result = sortWorldsendRecords(records, 'score', null).map((record) => record.id)

  // Then: 入力順を維持する。
  assert.deepEqual(result, ['low', 'high'])
})
