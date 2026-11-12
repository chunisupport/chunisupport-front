import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../types/api'
import { buildOverPowerChartEntries, selectOverPowerChartEntries } from './aggregation'
import { OVER_POWER_MASTER_ULTIMA_TARGET, OVER_POWER_THEORETICAL_TARGET } from './constants'
import {
  buildLevelSummaries,
  buildNameFolderSummaries,
  buildOverPowerSummary,
} from './overpowerSummary'

const versions: VersionSummaryDTO[] = [
  { name: 'CHUNITHM', short_name: 'ORI', released_at: '2015-07-16' },
  { name: 'CHUNITHM NEW', short_name: 'NEW', released_at: '2021-11-04' },
  { name: 'CHUNITHM VERSE', short_name: 'VRS', released_at: '2024-12-12' },
]

/**
 * OVER POWERサマリー用テストで使う楽曲DTOを生成する。
 *
 * @param overrides - テストケースごとに上書きする楽曲DTOの一部。楽曲IDは必須。
 * @returns 既定値を補完した楽曲DTO。
 */
const createSong = (overrides: Partial<SongDTO> & Pick<SongDTO, 'id'>): SongDTO => ({
  id: overrides.id,
  title: overrides.title ?? overrides.id,
  reading: overrides.reading ?? null,
  name_folder_code: overrides.name_folder_code ?? 'NUMBER',
  artist: overrides.artist ?? 'artist',
  genre: overrides.genre ?? 'POPS',
  bpm: overrides.bpm ?? null,
  release: overrides.release === undefined ? '2021-11-04' : overrides.release,
  jacket: overrides.jacket ?? null,
  maxop: overrides.maxop ?? 90,
  is_maxop_unknown: overrides.is_maxop_unknown ?? false,
  op_target_difficulty: overrides.op_target_difficulty ?? 'MASTER',
  is_new: overrides.is_new ?? false,
  unlock_required: overrides.unlock_required ?? false,
  charts: overrides.charts ?? {
    MASTER: {
      const: 15,
      is_const_unknown: false,
      notes: null,
    },
  },
})

/**
 * OVER POWERサマリー用テストで使うプレイヤーレコードDTOを生成する。
 *
 * @param overrides - テストケースごとに上書きするプレイヤーレコードDTOの一部。楽曲IDは必須。
 * @returns 既定値を補完したプレイヤーレコードDTO。
 */
const createRecord = (
  overrides: Partial<PlayerRecordDTO> & Pick<PlayerRecordDTO, 'id'>
): PlayerRecordDTO => ({
  is_played: overrides.is_played ?? true,
  is_op_target: overrides.is_op_target ?? true,
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

test('ALLは曲ごとの現在OP対象record.overpowerとsong.maxopを1回ずつ集計する', () => {
  const summary = buildOverPowerSummary(
    [createSong({ id: 'song-a', maxop: 90 }), createSong({ id: 'song-b', maxop: 80 })],
    [
      createRecord({ id: 'song-a', difficulty: 'EXPERT', overpower: 70, is_op_target: false }),
      createRecord({ id: 'song-a', difficulty: 'MASTER', overpower: 85 }),
      createRecord({ id: 'song-b', is_played: false, overpower: 0 }),
    ],
    versions
  )

  assert.equal(summary.all.current, 85)
  assert.equal(summary.all.max, 170)
  assert.equal(summary.all.count, 2)
  assert.equal(summary.all.percent, 50)
})

test('ALLのOP数値は理論値最大譜面が未プレイでも現在OP対象record.overpowerを維持する', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({
        id: 'song-a',
        maxop: 90,
        charts: {
          EXPERT: { const: 13, is_const_unknown: false, notes: null },
          MASTER: { const: 14, is_const_unknown: false, notes: null },
          ULTIMA: { const: 15, is_const_unknown: false, notes: null },
        },
      }),
    ],
    [createRecord({ id: 'song-a', difficulty: 'EXPERT', overpower: 70 })],
    versions
  )

  assert.equal(summary.all.current, 70)
  assert.equal(summary.all.max, 90)
  assert.equal(summary.all.count, 1)
})

test('現在OP対象フラグが全てfalseでも曲内最大OPへフォールバックする', () => {
  // Given: 先頭のEXPERTより後続のMASTERの現在OPが大きい。
  const songs = [
    createSong({
      id: 'song-a',
      maxop: 90,
      charts: {
        EXPERT: { const: 13, is_const_unknown: false, notes: null },
        MASTER: { const: 15, is_const_unknown: false, notes: null },
      },
    }),
  ]

  // When
  const summary = buildOverPowerSummary(
    songs,
    [
      createRecord({ id: 'song-a', difficulty: 'EXPERT', overpower: 70, is_op_target: false }),
      createRecord({ id: 'song-a', difficulty: 'MASTER', overpower: 85, is_op_target: false }),
    ],
    versions
  )

  // Then: 先頭候補ではなく最大OPのMASTERを曲の現在値に採用する。
  assert.equal(summary.all.current, 85)
  assert.equal(summary.all.max, 90)
  assert.deepEqual(
    summary.levels.map((row) => row.label),
    ['15']
  )
})

test('未プレイ曲は理論値対象難易度のレベルへ分類する', () => {
  // Given
  const songs = [
    createSong({
      id: 'unplayed',
      maxop: 90,
      op_target_difficulty: 'MASTER',
      charts: {
        BASIC: { const: 3, is_const_unknown: false, notes: null },
        MASTER: { const: 15, is_const_unknown: false, notes: null },
      },
    }),
  ]

  // When
  const summary = buildOverPowerSummary(songs, [], versions)

  // Then
  assert.deepEqual(
    summary.levels.map((row) => [row.label, row.current, row.max, row.count]),
    [['15', 0, 90, 1]]
  )
})

test('ジャンル不明とバージョン不明も内訳に含め、ALLと内訳の合計を一致させる', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({ id: 'known', genre: 'niconico', release: '2024-12-12', maxop: 90 }),
      createSong({ id: 'unknown', genre: '不明', release: null, maxop: 80 }),
    ],
    [createRecord({ id: 'known', overpower: 60 }), createRecord({ id: 'unknown', overpower: 40 })],
    versions
  )

  const genreByLabel = new Map(summary.genres.map((row) => [row.label, row]))
  const versionByLabel = new Map(summary.versions.map((row) => [row.label, row]))

  assert.equal(summary.all.current, 100)
  assert.deepEqual(
    [genreByLabel.get('niconico')?.current, genreByLabel.get('不明')?.current],
    [60, 40]
  )
  assert.deepEqual(
    [versionByLabel.get('VERSE')?.current, versionByLabel.get('不明')?.current],
    [60, 40]
  )
  assert.equal(
    summary.genres.reduce((total, row) => total + row.current, 0),
    summary.all.current
  )
  assert.equal(
    summary.versions.reduce((total, row) => total + row.current, 0),
    summary.all.current
  )
})

test('バージョン別はリリース日順で並ぶ', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({ id: 'verse', release: '2024-12-12', maxop: 90 }),
      createSong({ id: 'new', release: '2021-11-04', maxop: 80 }),
    ],
    [createRecord({ id: 'verse', overpower: 80 }), createRecord({ id: 'new', overpower: 70 })],
    versions
  )

  assert.deepEqual(
    summary.versions.map((row) => row.label),
    ['NEW', 'VERSE']
  )
})

test('ジャンル別はマスタのsort_order順で並ぶ', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({ id: 'touhou', genre: '東方Project', maxop: 90 }),
      createSong({ id: 'pops', genre: 'POPS & ANIME', maxop: 90 }),
      createSong({ id: 'niconico', genre: 'niconico', maxop: 90 }),
    ],
    [
      createRecord({ id: 'touhou', overpower: 80 }),
      createRecord({ id: 'pops', overpower: 80 }),
      createRecord({ id: 'niconico', overpower: 80 }),
    ],
    versions,
    [],
    [
      { id: 1, name: 'POPS & ANIME', sort_order: 10 },
      { id: 2, name: 'niconico', sort_order: 20 },
      { id: 3, name: '東方Project', sort_order: 30 },
    ]
  )

  assert.deepEqual(
    summary.genres.map((row) => row.label),
    ['POPS & ANIME', 'niconico', '東方Project']
  )
})

test('全難易度のレベル別は譜面単位で表示レベルへ変換して集計し、同曲重複を含める', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({
        id: 'same-song',
        maxop: 99,
        charts: {
          EXPERT: { const: 14.5, is_const_unknown: false, notes: null },
          MASTER: { const: 14.5, is_const_unknown: false, notes: null },
        },
      }),
      createSong({
        id: 'low',
        maxop: 62.5,
        charts: { MASTER: { const: 9.5, is_const_unknown: false, notes: null } },
      }),
    ],
    [
      createRecord({ id: 'same-song', difficulty: 'EXPERT', const: 14.5, overpower: 70 }),
      createRecord({ id: 'same-song', difficulty: 'MASTER', const: 14.5, overpower: 80 }),
      createRecord({ id: 'low', difficulty: 'MASTER', const: 9.5, overpower: 10 }),
    ],
    versions,
    [],
    undefined,
    'ALL'
  )

  assert.deepEqual(
    summary.levels.map((row) => [row.label, row.current, row.max, row.count, row.isLowLevel]),
    [
      ['9+', 10, 62.5, 1, true],
      ['14+', 150, 175, 2, false],
    ]
  )
})

test('曲マスタにnull譜面が含まれていてもレベル別集計で落ちない', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({
        id: 'nullable-chart',
        maxop: 87.5,
        charts: {
          BASIC: null,
          MASTER: { const: 14.5, is_const_unknown: false, notes: null },
        } as unknown as SongDTO['charts'],
      }),
    ],
    [createRecord({ id: 'nullable-chart', const: 14.5, overpower: 80 })],
    versions
  )

  assert.deepEqual(
    summary.levels.map((row) => row.label),
    ['14+']
  )
})

test('指定難易度は楽曲マスタに存在する譜面単位で現在値と理論値を集計する', () => {
  const summary = buildOverPowerSummary(
    [createSong({ id: 'song-a' })],
    [
      createRecord({ id: 'song-a', difficulty: 'BASIC', const: 2, overpower: 20 }),
      createRecord({ id: 'song-a', difficulty: 'MASTER', const: 15, overpower: 85 }),
    ],
    versions,
    [],
    undefined,
    'MASTER'
  )

  assert.deepEqual([summary.all.current, summary.all.max, summary.all.count], [85, 90, 1])
})

test('MASTER + ULTIMAはOP対象に関係なく両難易度の譜面を単純加算する', () => {
  // Given: 同じ曲にEXPERT、MASTER、ULTIMAがあり、ULTIMAだけOP対象外になっている。
  const songs = [
    createSong({
      id: 'master-ultima',
      charts: {
        EXPERT: { const: 13, is_const_unknown: false, notes: null },
        MASTER: { const: 14, is_const_unknown: false, notes: null },
        ULTIMA: { const: 15, is_const_unknown: false, notes: null },
      },
    }),
  ]
  const records = [
    createRecord({
      id: 'master-ultima',
      difficulty: 'EXPERT',
      const: 13,
      overpower: 70,
      is_op_target: false,
    }),
    createRecord({
      id: 'master-ultima',
      difficulty: 'MASTER',
      const: 14,
      overpower: 80,
      is_op_target: true,
    }),
    createRecord({
      id: 'master-ultima',
      difficulty: 'ULTIMA',
      const: 15,
      overpower: 88,
      is_op_target: false,
    }),
  ]

  // When: MASTER + ULTIMAを集計対象にする。
  const summary = buildOverPowerSummary(
    songs,
    records,
    versions,
    [],
    undefined,
    OVER_POWER_MASTER_ULTIMA_TARGET
  )

  // Then: EXPERTを除き、同じ曲のMASTERとULTIMAをそれぞれ1譜面として加算する。
  assert.deepEqual([summary.all.current, summary.all.max, summary.all.count], [168, 175, 2])
})

test('全難易度とレベル別はレコードがない未プレイ譜面も集計する', () => {
  // Given
  const songs = [
    createSong({
      id: 'unplayed-chart',
      charts: {
        EXPERT: { const: 13, is_const_unknown: false, notes: null },
        MASTER: { const: 15, is_const_unknown: false, notes: null },
      },
    }),
  ]

  // When
  const summary = buildOverPowerSummary(
    songs,
    [createRecord({ id: 'unplayed-chart', difficulty: 'MASTER', const: 15, overpower: 80 })],
    versions,
    [],
    undefined,
    'ALL'
  )

  // Then
  assert.deepEqual([summary.all.current, summary.all.max, summary.all.count], [80, 170, 2])
  assert.deepEqual(
    summary.levels.map((row) => [row.label, row.current, row.count]),
    [
      ['13', 0, 1],
      ['15', 80, 1],
    ]
  )
})

test('通常未解禁楽曲は既定のOP対象集計から除外する', () => {
  // Given: 通常未解禁曲と利用可能な曲がある。
  // When
  const summary = buildOverPowerSummary(
    [createSong({ id: 'locked', maxop: 90 }), createSong({ id: 'available', maxop: 80 })],
    [
      createRecord({ id: 'locked', difficulty: 'MASTER', overpower: 85 }),
      createRecord({ id: 'available', difficulty: 'MASTER', overpower: 70, const: 13 }),
    ],
    versions,
    [{ id: 'locked', is_ultima: false }]
  )

  // Then
  assert.equal(summary.all.current, 70)
  assert.equal(summary.all.max, 80)
  assert.equal(summary.all.count, 1)
  assert.deepEqual(
    summary.levels.map((row) => row.label),
    ['15']
  )
})

for (const target of ['ALL', 'MASTER'] as const) {
  test(`通常未解禁楽曲は${target}の譜面単位集計から除外する`, () => {
    // Given: 両曲ともEXPERTとMASTERを持ち、未解禁曲だけが除外対象となる。
    const songs = [
      createSong({
        id: 'locked',
        charts: {
          EXPERT: { const: 12, is_const_unknown: false, notes: null },
          MASTER: { const: 15, is_const_unknown: false, notes: null },
        },
      }),
      createSong({
        id: 'available',
        charts: {
          EXPERT: { const: 13, is_const_unknown: false, notes: null },
          MASTER: { const: 14, is_const_unknown: false, notes: null },
        },
      }),
    ]
    const records = [
      createRecord({ id: 'locked', difficulty: 'EXPERT', overpower: 60 }),
      createRecord({ id: 'locked', difficulty: 'MASTER', overpower: 85 }),
      createRecord({ id: 'available', difficulty: 'EXPERT', overpower: 50 }),
      createRecord({ id: 'available', difficulty: 'MASTER', overpower: 70 }),
    ]

    // When
    const summary = buildOverPowerSummary(
      songs,
      records,
      versions,
      [{ id: 'locked', is_ultima: false }],
      undefined,
      target
    )

    // Then: 利用可能な曲の対象譜面だけが全体とレベル別に残る。
    assert.deepEqual(
      [summary.all.current, summary.all.max, summary.all.count],
      target === 'ALL' ? [120, 165, 2] : [70, 85, 1]
    )
    assert.deepEqual(
      summary.levels.map((row) => [row.label, row.current, row.max, row.count]),
      target === 'ALL'
        ? [
            ['13', 50, 80, 1],
            ['14', 70, 85, 1],
          ]
        : [['14', 70, 85, 1]]
    )
  })
}

test('ULTIMA未解禁はULTIMA譜面だけを集計から除外する', () => {
  const summary = buildOverPowerSummary(
    [
      createSong({
        id: 'song-a',
        maxop: 95,
        charts: {
          MASTER: { const: 14, is_const_unknown: false, notes: null },
          ULTIMA: { const: 16, is_const_unknown: false, notes: null },
        },
      }),
    ],
    [
      createRecord({ id: 'song-a', difficulty: 'MASTER', overpower: 80, const: 14 }),
      createRecord({ id: 'song-a', difficulty: 'ULTIMA', overpower: 92, const: 16 }),
    ],
    versions,
    [{ id: 'song-a', is_ultima: true }]
  )

  assert.equal(summary.all.current, 80)
  assert.equal(summary.all.max, 85)
  assert.deepEqual(
    summary.levels.map((row) => row.label),
    ['14']
  )
})

test('OP理論値対象は現在のOP対象フラグに関係なく楽曲マスタの対象譜面だけを曲ごとに集計する', () => {
  // Given: 現在のOP対象はEXPERTだが、理論値OP対象はULTIMAの楽曲。
  const songs = [
    createSong({
      id: 'song-a',
      op_target_difficulty: 'ULTIMA',
      charts: {
        EXPERT: { const: 13, is_const_unknown: false, notes: null },
        ULTIMA: { const: 15, is_const_unknown: false, notes: null },
      },
    }),
    createSong({ id: 'song-b', op_target_difficulty: 'ULTIMA' }),
  ]
  const records = [
    createRecord({ id: 'song-a', difficulty: 'EXPERT', overpower: 70, is_op_target: true }),
    createRecord({ id: 'song-a', difficulty: 'ULTIMA', overpower: 60, is_op_target: false }),
  ]

  // When: OP理論値対象で集計する。
  const summary = buildOverPowerSummary(
    songs,
    records,
    versions,
    [],
    undefined,
    OVER_POWER_THEORETICAL_TARGET
  )

  // Then: 対象難易度の譜面を持たない曲は除外され、ULTIMAだけが集計される。
  assert.equal(summary.all.count, 1)
  assert.equal(summary.all.current, 60)
  assert.equal(summary.all.max, 90)
})

test('楽曲名順フォルダごとにOPを集計し、マスタの表示順で並べる', () => {
  // Given
  const songs = [
    createSong({ id: 'a', name_folder_code: 'A' }),
    createSong({ id: 'number', name_folder_code: 'NUMBER' }),
    createSong({ id: 'custom', name_folder_code: 'CUSTOM' }),
  ]
  const records = [createRecord({ id: 'a', overpower: 80 })]
  const entries = buildOverPowerChartEntries(songs, records, versions)
  const nameFolders = [
    { code: 'A', name: 'A', sort_order: 2 },
    { code: 'NUMBER', name: '数字', sort_order: 1 },
  ]

  // When
  const result = buildNameFolderSummaries(entries, nameFolders)

  // Then
  assert.deepEqual(
    result.map((row) => [row.id, row.label, row.current, row.max]),
    [
      ['NUMBER', '数字', 0, 90],
      ['A', 'A', 80, 90],
      ['CUSTOM', 'CUSTOM', 0, 90],
    ]
  )
})

test('全譜面のレベル別集計はOP対象外と未プレイを含み、他分類は現在OP対象だけを集計する', () => {
  // Given
  const songs = [
    createSong({
      id: 'multi',
      maxop: 90,
      charts: {
        EXPERT: { const: 13, is_const_unknown: false, notes: null },
        MASTER: { const: 13.4, is_const_unknown: false, notes: null },
        ULTIMA: { const: 15, is_const_unknown: false, notes: null },
      },
    }),
  ]
  const records = [
    createRecord({ id: 'multi', difficulty: 'EXPERT', overpower: 40, is_op_target: false }),
    createRecord({ id: 'multi', difficulty: 'MASTER', overpower: 60, is_op_target: true }),
    createRecord({
      id: 'multi',
      difficulty: 'ULTIMA',
      overpower: 0,
      is_played: false,
      is_op_target: false,
    }),
  ]
  const entries = buildOverPowerChartEntries(songs, records, versions)

  // When
  const levels = buildLevelSummaries(entries)
  const summary = buildOverPowerSummary(songs, records, versions)
  const nameFolders = buildNameFolderSummaries(selectOverPowerChartEntries(entries, 'OP_TARGET'), [
    { code: 'NUMBER', name: '数字', sort_order: 1 },
  ])

  // Then
  assert.deepEqual(
    levels.map(({ level, current, max, count }) => ({ level, current, max, count })),
    [
      { level: '13', current: 100, max: 162, count: 2 },
      { level: '15', current: 0, max: 90, count: 1 },
    ]
  )
  assert.equal(levels[0].percent, (100 / 162) * 100)
  assert.equal(levels[1].percent, 0)
  for (const row of [summary.all, ...summary.genres, ...summary.versions, ...nameFolders]) {
    assert.equal(row.current, 60)
    assert.equal(row.max, 90)
    assert.equal(row.count, 1)
  }
})
