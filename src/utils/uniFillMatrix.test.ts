import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO } from '../types/api'
import { DEFAULT_FILTER } from './recordFilterDefaults'
import {
  buildUniFillMatrix,
  buildUniFillMatrixRecordFilter,
  countUniFillMatrixChecks,
  formatUniFillMatrixImageFilename,
} from './uniFillMatrix'

/**
 * マトリクステスト用の通常譜面レコードを生成する。
 *
 * @param overrides - テストケースごとに変更するレコード値。
 * @returns 既定値と上書き値を合わせた通常譜面レコード。
 */
const createRecord = (overrides: Partial<PlayerRecordDTO> = {}): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: false,
  updated_at: null,
  difficulty: 'MASTER',
  id: 'song-1',
  title: '楽曲1',
  artist: 'アーティスト',
  const: 14.5,
  is_const_unknown: false,
  score: 1_009_000,
  rating: 0,
  overpower: 0,
  justice_count: null,
  overpower_percent: 0,
  img: '',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

const ATTRIBUTES = new Map([
  ['pops-1', { genre: 'POPS & ANIME' }],
  ['pops-2', { genre: 'POPS & ANIME' }],
  ['orig-1', { genre: 'ORIGINAL' }],
])

const GENRES = ['POPS & ANIME', 'niconico', 'ORIGINAL']

test('バージョン横軸はPLUSを分けて一覧順に集計し、公開対象外と属性不明の譜面を除く', () => {
  // Given
  const attributes = new Map([
    ['base', { genre: 'ORIGINAL', version: 'VERSE' }],
    ['plus', { genre: 'POPS & ANIME', version: 'VERSE PLUS' }],
    ['future', { genre: 'ORIGINAL', version: '未来' }],
    ['unknown', { genre: 'ORIGINAL', version: '不明' }],
  ])
  const records = [
    createRecord({ id: 'plus', const: 14.5, is_played: false, score: 0 }),
    createRecord({ id: 'base', const: 13.0 }),
    createRecord({ id: 'base', difficulty: 'ULTIMA', const: 14.5 }),
    createRecord({ id: 'future', const: 15.0 }),
    createRecord({ id: 'unknown', const: 15.0 }),
    createRecord({ id: 'missing', const: 15.0 }),
  ]

  // When
  const matrix = buildUniFillMatrix(records, attributes, GENRES, 'level', 'sss', {
    axis: 'version',
    versions: ['空のバージョン', 'VERSE', 'VERSE PLUS'],
  })

  // Then
  assert.deepEqual(matrix.rows, [
    {
      version: 'VERSE',
      label: 'VERSE',
      cells: [
        { count: 1, total: 1 },
        { count: 1, total: 1 },
      ],
      total: { count: 2, total: 2 },
    },
    {
      version: 'VERSE PLUS',
      label: 'VERSE PLUS',
      cells: [
        { count: 0, total: 1 },
        { count: 0, total: 0 },
      ],
      total: { count: 0, total: 1 },
    },
  ])
  assert.deepEqual(matrix.columnTotals, [
    { count: 1, total: 2 },
    { count: 1, total: 1 },
  ])
  assert.deepEqual(matrix.grandTotal, { count: 2, total: 3 })
  assert.deepEqual(countUniFillMatrixChecks(matrix), { count: 2, total: 3 })
})

test('バージョンの通常マスと合計マスはバージョン条件を引き継ぐ', () => {
  // Given
  const [column] = buildUniFillMatrix(
    [createRecord({ id: 'orig-1' })],
    ATTRIBUTES,
    GENRES,
    'chartConstant',
    'sss'
  ).columns

  // When
  const cellFilter = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, {
    difficulty: 'MASTER_ULTIMA',
    achievement: 'sss',
    version: 'VERSE PLUS',
    column,
  })
  const totalFilter = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, {
    difficulty: 'MASTER_ULTIMA',
    achievement: 'sss',
    version: 'VERSE PLUS',
  })

  // Then
  assert.deepEqual(cellFilter.versions, ['VERSE PLUS'])
  assert.deepEqual(cellFilter.genres, DEFAULT_FILTER.genres)
  assert.deepEqual(cellFilter.const, { min: 14.5, max: 14.5 })
  assert.deepEqual(totalFilter.versions, ['VERSE PLUS'])
  assert.deepEqual(totalFilter.const, DEFAULT_FILTER.const)
})

test('バージョン横軸の画像ファイル名にはversionが入る', () => {
  // Given
  const date = new Date(2026, 9, 6, 9, 5, 7)

  // When
  const filename = formatUniFillMatrixImageFilename(
    { difficulty: 'MASTER', achievement: 'sss', axis: 'level', horizontalAxis: 'version' },
    date
  )

  // Then
  assert.equal(filename, 'chunisupport-uni-fill-matrix-master-sss-level-version-20261006090507.png')
})

test('レベル別ではジャンル×レベルごとに達成件数と総数を集計し、レベルが高い順に並べる', () => {
  // Given
  const records = [
    createRecord({ id: 'pops-1', const: 14.5, score: 1_009_000 }),
    createRecord({ id: 'pops-2', const: 14.9, score: 1_007_000 }),
    createRecord({ id: 'orig-1', const: 13.2, score: 1_009_500 }),
  ]

  // When
  const result = buildUniFillMatrix(records, ATTRIBUTES, GENRES, 'level', 'sss')

  // Then
  assert.deepEqual(
    result.columns.map((column) => column.label),
    ['14+', '13']
  )
  assert.deepEqual(result.rows, [
    {
      genre: 'POPS & ANIME',
      label: 'POPS & ANIME',
      cells: [
        { count: 1, total: 2 },
        { count: 0, total: 0 },
      ],
      total: { count: 1, total: 2 },
    },
    {
      genre: 'ORIGINAL',
      label: 'ORIGINAL',
      cells: [
        { count: 0, total: 0 },
        { count: 1, total: 1 },
      ],
      total: { count: 1, total: 1 },
    },
  ])
  assert.deepEqual(result.columnTotals, [
    { count: 1, total: 2 },
    { count: 1, total: 1 },
  ])
  assert.deepEqual(result.grandTotal, { count: 2, total: 3 })
})

test('譜面定数別では小数点以下1桁の譜面定数ごとに列を分ける', () => {
  // Given
  const records = [
    createRecord({ id: 'pops-1', const: 14.5 }),
    createRecord({ id: 'pops-2', const: 14.9 }),
  ]

  // When
  const result = buildUniFillMatrix(records, ATTRIBUTES, GENRES, 'chartConstant', 'played')

  // Then
  assert.deepEqual(
    result.columns.map((column) => column.label),
    ['14.9', '14.5']
  )
  assert.deepEqual(result.grandTotal, { count: 2, total: 2 })
})

test('未プレイ譜面は総数に含めるが達成件数には含めない', () => {
  // Given
  const records = [createRecord({ id: 'orig-1', is_played: false, score: 0, clear_lamp: null })]

  // When
  const result = buildUniFillMatrix(records, ATTRIBUTES, GENRES, 'level', 'played')

  // Then
  assert.deepEqual(result.grandTotal, { count: 0, total: 1 })
})

test('ジャンル情報がない譜面や表示対象外ジャンルの譜面は列も含めて集計から除外する', () => {
  // Given
  const attributes = new Map([...ATTRIBUTES, ['other-1', { genre: '未知のジャンル' }]])
  const records = [
    createRecord({ id: 'unknown-song' }),
    createRecord({ id: 'other-1', const: 15.0 }),
  ]

  // When
  const result = buildUniFillMatrix(records, attributes, GENRES, 'level', 'sss')

  // Then
  assert.deepEqual(result.columns, [])
  assert.deepEqual(result.rows, [])
  assert.deepEqual(result.grandTotal, { count: 0, total: 0 })
})

test('レベル別のマスはジャンル・レベル範囲・スコア上限を指定したレコードフィルターになる', () => {
  // Given
  const [column] = buildUniFillMatrix(
    [createRecord({ id: 'pops-1', const: 14.7 })],
    ATTRIBUTES,
    GENRES,
    'level',
    'sss'
  ).columns

  // When
  const result = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, {
    difficulty: 'MASTER_ULTIMA',
    achievement: 'sss',
    genre: 'POPS & ANIME',
    column,
  })

  // Then
  assert.deepEqual(result.difficulties, ['MASTER', 'ULTIMA'])
  assert.deepEqual(result.genres, ['POPS & ANIME'])
  assert.deepEqual(result.const, { min: 14.5, max: 14.9 })
  assert.equal(result.constFilterMode, 'level')
  assert.deepEqual(result.score, { min: 0, max: 1_007_499 })
  assert.equal(result.scoreFilterMode, 'number')
})

test('レベル6以下の列はフィルターのレベル指定と範囲が異なるため数値指定になる', () => {
  // Given
  const [column] = buildUniFillMatrix(
    [createRecord({ id: 'pops-1', const: 5.5 })],
    ATTRIBUTES,
    GENRES,
    'level',
    'sss'
  ).columns

  // When
  const result = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, {
    difficulty: 'BASIC',
    achievement: 'sss',
    column,
  })

  // Then
  assert.deepEqual(result.const, { min: 5.5, max: 5.9 })
  assert.equal(result.constFilterMode, 'number')
})

test('譜面定数別のマスは単一の譜面定数を数値指定したフィルターになる', () => {
  // Given
  const [column] = buildUniFillMatrix(
    [createRecord({ id: 'orig-1', const: 13.2 })],
    ATTRIBUTES,
    GENRES,
    'chartConstant',
    'aj'
  ).columns

  // When
  const result = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, {
    difficulty: 'EXPERT',
    achievement: 'aj',
    column,
  })

  // Then
  assert.deepEqual(result.difficulties, ['EXPERT'])
  assert.deepEqual(result.genres, DEFAULT_FILTER.genres)
  assert.deepEqual(result.const, { min: 13.2, max: 13.2 })
  assert.equal(result.constFilterMode, 'number')
  assert.deepEqual(result.combo_lamp, ['FULL COMBO', null])
})

test('OP理論値対象の総合計マスは全難易度の理論値OP対象と未達成ランプ条件だけを指定する', () => {
  // Given
  const target = {
    difficulty: 'OP_TARGET',
    achievement: 'hard',
  } as const

  // When
  const result = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, target)

  // Then
  assert.deepEqual(result.difficulties, ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'])
  assert.equal(result.opTargetOnly, true)
  assert.equal(result.opTargetType, 'theoretical')
  assert.deepEqual(result.const, DEFAULT_FILTER.const)
  assert.deepEqual(result.hard_lamp, ['CLEAR', 'FAILED', null])
})

test('全難易度のマスは全難易度を選択し、OP対象では絞り込まない', () => {
  // Given
  const target = { difficulty: 'ALL', achievement: 'fc' } as const

  // When
  const result = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, target)

  // Then
  assert.deepEqual(result.difficulties, ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'])
  assert.equal(result.opTargetOnly, false)
  assert.deepEqual(result.combo_lamp, [null])
})

test('AJC未達成はAJCを除いたコンボランプ、未プレイはスコア0だけを表示するフィルターになる', () => {
  // Given
  const base = { difficulty: 'MASTER' } as const

  // When
  const ajc = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, { ...base, achievement: 'ajc' })
  const played = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, { ...base, achievement: 'played' })

  // Then
  assert.deepEqual(ajc.combo_lamp, ['ALL JUSTICE', 'FULL COMBO', null])
  assert.deepEqual(played.score, { min: 0, max: 0 })
})

test('チェック数は対象譜面のある通常マスだけを数え、未達成マスと合計のチェックを区別する', () => {
  // Given
  const matrix = buildUniFillMatrix(
    [
      createRecord({ id: 'pops-1', const: 14.5, score: 1_009_000 }),
      createRecord({ id: 'pops-2', const: 14.9, score: 1_007_000 }),
      createRecord({ id: 'orig-1', const: 13.2, score: 1_009_500 }),
    ],
    ATTRIBUTES,
    GENRES,
    'level',
    'sss'
  )

  // When
  const result = countUniFillMatrixChecks(matrix)

  // Then
  assert.deepEqual(result, { count: 1, total: 2 })
})

test('全件達成時のチェック数は譜面数ではなくマス数となり、空マスや合計を含めない', () => {
  // Given
  const matrix = buildUniFillMatrix(
    [
      createRecord({ id: 'pops-1', const: 14.5 }),
      createRecord({ id: 'pops-2', const: 14.9 }),
      createRecord({ id: 'orig-1', const: 13.2 }),
    ],
    ATTRIBUTES,
    GENRES,
    'level',
    'played'
  )

  // When
  const result = countUniFillMatrixChecks(matrix)

  // Then
  assert.deepEqual(result, { count: 2, total: 2 })
})

test('対象譜面がないマトリクスのチェック数は0 / 0となる', () => {
  // Given
  const matrix = buildUniFillMatrix([], ATTRIBUTES, GENRES, 'chartConstant', 'played')

  // When
  const result = countUniFillMatrixChecks(matrix)

  // Then
  assert.deepEqual(result, { count: 0, total: 0 })
})

test('画像ファイル名は表示条件と日時を含む小文字の名前になる', () => {
  // Given
  const condition = {
    difficulty: 'MASTER_ULTIMA',
    achievement: 'sssPlus',
    axis: 'chartConstant',
  } as const
  const date = new Date(2026, 9, 4, 9, 5, 7)

  // When
  const result = formatUniFillMatrixImageFilename(condition, date)

  // Then
  assert.equal(
    result,
    'chunisupport-uni-fill-matrix-master-ultima-sssplus-chartconstant-20261004090507.png'
  )
})

test('APIの短縮名は見出しに使い、ジャンル・バージョンの集計とフィルター条件を維持する', () => {
  // Given
  const attributes = new Map([['song-1', { genre: 'POPS & ANIME', version: 'VERSE PLUS' }]])
  const records = [createRecord()]
  const cases = [
    { axis: 'genre', name: 'POPS & ANIME', shortName: 'P&A' },
    { axis: 'version', name: 'VERSE PLUS', shortName: 'VRS+' },
  ] as const

  for (const { axis, name, shortName } of cases) {
    // When
    const matrix = buildUniFillMatrix(records, attributes, GENRES, 'level', 'sss', {
      axis,
      versions: ['VERSE PLUS'],
      shortNames: new Map([[name, shortName]]),
    })
    const [row] = matrix.rows
    const filter = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, {
      difficulty: 'MASTER',
      achievement: 'sss',
      genre: row.genre,
      version: row.version,
    })

    // Then
    assert.equal(row.label, shortName)
    assert.equal(row[axis], name)
    assert.deepEqual(row.total, { count: 1, total: 1 })
    assert.deepEqual(axis === 'genre' ? filter.genres : filter.versions, [name])
  }
})
