import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO } from '../types/api'
import type { PlayerStatsAchievement } from './playerStatsDashboard'
import { DEFAULT_FILTER } from './recordFilterDefaults'
import {
  buildUniFillMatrix,
  buildUniFillMatrixRecordFilter,
  countUniFillMatrixChecks,
  formatUniFillMatrixImageFilename,
  normalizeUniFillMatrixViewSettings,
  type UniFillMatrix,
  type UniFillMatrixLayout,
  type UniFillMatrixLevelConst,
  type UniFillMatrixSongAttributes,
  type UniFillMatrixViewSettings,
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

const ATTRIBUTES: ReadonlyMap<string, UniFillMatrixSongAttributes> = new Map([
  ['pops-1', { genre: 'POPS & ANIME' }],
  ['pops-2', { genre: 'POPS & ANIME' }],
  ['orig-1', { genre: 'ORIGINAL' }],
])

const GENRES = ['POPS & ANIME', 'niconico', 'ORIGINAL']

/**
 * 既定の軸（縦軸がレベル、横軸がジャンル）を一部変更してマトリクスを集計する。
 *
 * @param records - 集計対象の通常譜面レコード。
 * @param achievement - 埋め終わりとみなす到達条件。
 * @param layout - 既定の条件から変更する項目。
 * @param attributes - 曲IDごとの楽曲属性。
 * @returns 集計済みのマトリクス。
 */
const build = (
  records: readonly PlayerRecordDTO[],
  achievement: PlayerStatsAchievement = 'sss',
  layout: Partial<UniFillMatrixLayout> = {},
  attributes: ReadonlyMap<string, UniFillMatrixSongAttributes> = ATTRIBUTES
): UniFillMatrix =>
  buildUniFillMatrix(records, attributes, achievement, {
    vertical: 'levelConst',
    horizontal: 'genre',
    levelConstAxis: 'level',
    genres: GENRES,
    versions: [],
    nameFolders: ['ABCD', 'A', 'NUMBER'],
    ...layout,
  })

/**
 * 表のマスを [見出し, 達成件数と総数] の一覧へ変換する。
 *
 * @param matrix - 集計済みのマトリクス。
 * @returns 行見出しと各マスの集計の組。
 */
const toLineSummary = (matrix: UniFillMatrix) =>
  matrix.lines.map((line) => [line.header.label, line.cells.map((gridCell) => gridCell.cell)])

/**
 * 1譜面だけのマトリクスからレベル・譜面定数の範囲を取得する。
 *
 * @param record - 集計対象の譜面。
 * @param levelConstAxis - レベル別または譜面定数別。
 * @returns 最初の行のレベル・譜面定数の範囲。
 */
const getLevelConst = (
  record: PlayerRecordDTO,
  levelConstAxis: UniFillMatrixLayout['levelConstAxis'] = 'level'
): UniFillMatrixLevelConst => {
  const levelConst = build([record], 'sss', { levelConstAxis }).lines[0].total.position?.levelConst
  assert.ok(levelConst)
  return levelConst
}

test('レベル別ではレベル×ジャンルごとに達成件数と総数を集計し、レベルが高い順・ジャンル一覧順に並べる', () => {
  // Given
  const records = [
    createRecord({ id: 'pops-1', const: 14.5, score: 1_009_000 }),
    createRecord({ id: 'pops-2', const: 14.9, score: 1_007_000 }),
    createRecord({ id: 'orig-1', const: 13.2, score: 1_009_500 }),
  ]

  // When
  const result = build(records)

  // Then
  assert.equal(result.lineHeaderKind, 'axis')
  assert.deepEqual(result.columnHeaders, [
    { label: 'POPS & ANIME', kind: 'group' },
    { label: 'ORIGINAL', kind: 'group' },
  ])
  assert.deepEqual(toLineSummary(result), [
    [
      '14+',
      [
        { count: 1, total: 2 },
        { count: 0, total: 0 },
      ],
    ],
    [
      '13',
      [
        { count: 0, total: 0 },
        { count: 1, total: 1 },
      ],
    ],
  ])
  assert.deepEqual(
    result.lines.map((line) => line.total.cell),
    [
      { count: 1, total: 2 },
      { count: 1, total: 1 },
    ]
  )
  assert.deepEqual(
    result.totals.map((total) => total.cell),
    [
      { count: 1, total: 2 },
      { count: 1, total: 1 },
    ]
  )
  assert.deepEqual(result.grandTotal.cell, { count: 2, total: 3 })
})

test('縦軸と横軸を入れ替えるとジャンルを行、レベルを列にし、合計行はレベルの合計になる', () => {
  // Given
  const records = [
    createRecord({ id: 'pops-1', const: 14.5 }),
    createRecord({ id: 'orig-1', const: 13.0, score: 1_000_000 }),
  ]

  // When
  const result = build(records, 'sss', { vertical: 'genre', horizontal: 'levelConst' })

  // Then
  assert.equal(result.lineHeaderKind, 'group')
  assert.deepEqual(result.columnHeaders, [
    { label: '14+', kind: 'axis' },
    { label: '13', kind: 'axis' },
  ])
  assert.deepEqual(toLineSummary(result), [
    [
      'POPS & ANIME',
      [
        { count: 1, total: 1 },
        { count: 0, total: 0 },
      ],
    ],
    [
      'ORIGINAL',
      [
        { count: 0, total: 0 },
        { count: 0, total: 1 },
      ],
    ],
  ])
  assert.deepEqual(result.lines[1].total.position, { genre: 'ORIGINAL' })
  assert.deepEqual(
    result.totals.map((total) => total.position?.levelConst?.label),
    ['14+', '13']
  )
  assert.deepEqual(result.grandTotal, { cell: { count: 1, total: 2 }, position: {} })
})

test('通常マスは縦軸と横軸の両方、合計マスは片方の軸だけの絞り込み位置を持つ', () => {
  // Given
  const records = [createRecord({ id: 'orig-1', const: 13.0 })]

  // When
  const result = build(records)

  // Then
  const levelConst = result.lines[0].total.position?.levelConst
  assert.equal(levelConst?.label, '13')
  assert.deepEqual(result.lines[0].cells[0].position, { levelConst, genre: 'ORIGINAL' })
  assert.deepEqual(result.lines[0].total.position, { levelConst })
  assert.deepEqual(result.totals[0].position, { genre: 'ORIGINAL' })
})

test('ジャンル×バージョンではレベル・譜面定数を含まず、両方の名称で絞り込める', () => {
  // Given
  const attributes = new Map([
    ['base', { genre: 'ORIGINAL', version: 'VERSE' }],
    ['plus', { genre: 'POPS & ANIME', version: 'VERSE PLUS' }],
  ])
  const records = [
    createRecord({ id: 'plus', const: 14.5, score: 0, is_played: false }),
    createRecord({ id: 'base', const: 13.0 }),
    createRecord({ id: 'base', difficulty: 'ULTIMA', const: 14.5 }),
  ]

  // When
  const result = build(
    records,
    'sss',
    { vertical: 'version', horizontal: 'genre', versions: ['VERSE', 'VERSE PLUS'] },
    attributes
  )

  // Then
  assert.equal(result.lineHeaderKind, 'group')
  assert.deepEqual(toLineSummary(result), [
    [
      'VERSE',
      [
        { count: 0, total: 0 },
        { count: 2, total: 2 },
      ],
    ],
    [
      'VERSE PLUS',
      [
        { count: 0, total: 1 },
        { count: 0, total: 0 },
      ],
    ],
  ])
  assert.deepEqual(result.lines[1].cells[0].position, {
    version: 'VERSE PLUS',
    genre: 'POPS & ANIME',
  })
  assert.deepEqual(countUniFillMatrixChecks(result), { count: 1, total: 2 })
})

test('バージョンの軸はPLUSを分けて一覧順に集計し、公開対象外と属性不明の譜面を除く', () => {
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
  const result = build(
    records,
    'sss',
    { horizontal: 'version', versions: ['空のバージョン', 'VERSE', 'VERSE PLUS'] },
    attributes
  )

  // Then
  assert.deepEqual(
    result.columnHeaders.map((header) => header.label),
    ['VERSE', 'VERSE PLUS']
  )
  assert.deepEqual(toLineSummary(result), [
    [
      '14+',
      [
        { count: 1, total: 1 },
        { count: 0, total: 1 },
      ],
    ],
    [
      '13',
      [
        { count: 1, total: 1 },
        { count: 0, total: 0 },
      ],
    ],
  ])
  assert.deepEqual(result.grandTotal.cell, { count: 2, total: 3 })
})

test('楽曲名の軸は名前順フォルダの表示順に集計し、譜面がないフォルダを除く', () => {
  // Given
  const attributes = new Map([
    ['kana', { genre: 'ORIGINAL', nameFolder: 'A' as const }],
    ['number', { genre: 'ORIGINAL', nameFolder: 'NUMBER' as const }],
    ['alphabet', { genre: 'POPS & ANIME', nameFolder: 'ABCD' as const }],
  ])
  const records = [
    createRecord({ id: 'number', const: 14.0 }),
    createRecord({ id: 'kana', const: 14.0, score: 1_000_000 }),
    createRecord({ id: 'alphabet', const: 14.0 }),
  ]

  // When
  const result = build(
    records,
    'sss',
    {
      vertical: 'nameFolder',
      nameFolders: ['NUMBER', 'A', 'ABCD', 'UNUSED'],
      labels: { nameFolder: new Map([['A', 'APIのあ行']]) },
    },
    attributes
  )

  // Then
  assert.deepEqual(
    result.lines.map((line) => [line.header.label, line.total.cell]),
    [
      ['NUMBER', { count: 1, total: 1 }],
      ['APIのあ行', { count: 0, total: 1 }],
      ['ABCD', { count: 1, total: 1 }],
    ]
  )
})

test('名前順フォルダを含むマスと合計はフォルダのコードと表示名を位置に持つ', () => {
  // Given
  const attributes = new Map([['kana', { genre: 'ORIGINAL', nameFolder: 'A' as const }]])
  const records = [createRecord({ id: 'kana', const: 14.0, score: 1_000_000 })]
  const nameFolder = { code: 'A', label: 'あ行' }

  // When
  const result = build(
    records,
    'sss',
    {
      vertical: 'nameFolder',
      horizontal: 'genre',
      labels: { nameFolder: new Map([['A', 'あ行']]) },
    },
    attributes
  )

  // Then
  assert.deepEqual(result.lines[0].cells[0].position, { nameFolder, genre: 'ORIGINAL' })
  assert.deepEqual(result.lines[0].total.position, { nameFolder })
  assert.deepEqual(result.totals[0].position, { genre: 'ORIGINAL' })
  assert.deepEqual(result.grandTotal.position, {})
})

test('譜面定数別では小数点以下1桁の譜面定数ごとに分ける', () => {
  // Given
  const records = [
    createRecord({ id: 'pops-1', const: 14.5 }),
    createRecord({ id: 'pops-2', const: 14.9 }),
  ]

  // When
  const result = build(records, 'played', { levelConstAxis: 'chartConstant' })

  // Then
  assert.deepEqual(
    result.lines.map((line) => line.header.label),
    ['14.9', '14.5']
  )
  assert.deepEqual(result.grandTotal.cell, { count: 2, total: 2 })
})

test('未プレイ譜面は総数に含めるが達成件数には含めない', () => {
  // Given
  const records = [createRecord({ id: 'orig-1', is_played: false, score: 0, clear_lamp: null })]

  // When
  const result = build(records, 'played')

  // Then
  assert.deepEqual(result.grandTotal.cell, { count: 0, total: 1 })
})

test('ジャンル情報がない譜面や表示対象外ジャンルの譜面は他方の軸も含めて集計から除外する', () => {
  // Given
  const attributes = new Map([...ATTRIBUTES, ['other-1', { genre: '未知のジャンル' }]])
  const records = [
    createRecord({ id: 'unknown-song' }),
    createRecord({ id: 'other-1', const: 15.0 }),
  ]

  // When
  const result = build(records, 'sss', {}, attributes)

  // Then
  assert.deepEqual(result.columnHeaders, [])
  assert.deepEqual(result.lines, [])
  assert.deepEqual(result.grandTotal.cell, { count: 0, total: 0 })
})

test('APIの短縮名は見出しに使い、ジャンル・バージョンの絞り込み位置には短縮前の名称を使う', () => {
  // Given
  const attributes = new Map([['song-1', { genre: 'POPS & ANIME', version: 'VERSE PLUS' }]])
  const records = [createRecord()]

  // When
  const result = build(
    records,
    'sss',
    {
      vertical: 'version',
      horizontal: 'genre',
      versions: ['VERSE PLUS'],
      labels: {
        genre: new Map([['POPS & ANIME', 'P&A']]),
        version: new Map([['VERSE PLUS', 'VRS+']]),
      },
    },
    attributes
  )

  // Then
  assert.equal(result.lines[0].header.label, 'VRS+')
  assert.equal(result.columnHeaders[0].label, 'P&A')
  assert.deepEqual(result.lines[0].cells[0].position, {
    version: 'VERSE PLUS',
    genre: 'POPS & ANIME',
  })
})

test('レベル別のマスはジャンル・レベル範囲・スコア上限を指定したレコードフィルターになる', () => {
  // Given
  const levelConst = getLevelConst(createRecord({ id: 'pops-1', const: 14.7 }))

  // When
  const result = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, {
    difficulty: 'MASTER_ULTIMA',
    achievement: 'sss',
    genre: 'POPS & ANIME',
    levelConst,
  })

  // Then
  assert.deepEqual(result.difficulties, ['MASTER', 'ULTIMA'])
  assert.deepEqual(result.genres, ['POPS & ANIME'])
  assert.deepEqual(result.const, { min: 14.5, max: 14.9 })
  assert.equal(result.constFilterMode, 'level')
  assert.deepEqual(result.score, { min: 0, max: 1_007_499 })
  assert.equal(result.scoreFilterMode, 'number')
})

test('ジャンルとバージョンが交差するマスは両方の条件を引き継ぎ、譜面定数は既定値のままにする', () => {
  // Given
  const target = {
    difficulty: 'MASTER_ULTIMA',
    achievement: 'sss',
    genre: 'ORIGINAL',
    version: 'VERSE PLUS',
  } as const

  // When
  const result = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, target)

  // Then
  assert.deepEqual(result.genres, ['ORIGINAL'])
  assert.deepEqual(result.versions, ['VERSE PLUS'])
  assert.deepEqual(result.const, DEFAULT_FILTER.const)
})

test('名前順フォルダのマスはフォルダのコードで楽曲名順を絞り込む', () => {
  // Given
  const target = {
    difficulty: 'MASTER_ULTIMA',
    achievement: 'sss',
    nameFolder: { code: 'KA', label: 'か行' },
  } as const

  // When
  const result = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, target)

  // Then
  assert.deepEqual(result.nameFolders, ['KA'])
  assert.deepEqual(result.genres, DEFAULT_FILTER.genres)
})

test('名前順フォルダの軸を含まないマスは楽曲名順を全フォルダ対象のままにする', () => {
  // Given
  const target = { difficulty: 'MASTER_ULTIMA', achievement: 'sss', genre: 'ORIGINAL' } as const

  // When
  const result = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, target)

  // Then
  assert.equal(result.nameFolders, null)
})

test('レベル6以下はフィルターのレベル指定と範囲が異なるため数値指定になる', () => {
  // Given
  const levelConst = getLevelConst(createRecord({ id: 'pops-1', const: 5.5 }))

  // When
  const result = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, {
    difficulty: 'BASIC',
    achievement: 'sss',
    levelConst,
  })

  // Then
  assert.deepEqual(result.const, { min: 5.5, max: 5.9 })
  assert.equal(result.constFilterMode, 'number')
})

test('譜面定数別のマスは単一の譜面定数を数値指定したフィルターになる', () => {
  // Given
  const levelConst = getLevelConst(createRecord({ id: 'orig-1', const: 13.2 }), 'chartConstant')

  // When
  const result = buildUniFillMatrixRecordFilter(DEFAULT_FILTER, {
    difficulty: 'EXPERT',
    achievement: 'aj',
    levelConst,
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
  const matrix = build([
    createRecord({ id: 'pops-1', const: 14.5, score: 1_009_000 }),
    createRecord({ id: 'pops-2', const: 14.9, score: 1_007_000 }),
    createRecord({ id: 'orig-1', const: 13.2, score: 1_009_500 }),
  ])

  // When
  const result = countUniFillMatrixChecks(matrix)

  // Then
  assert.deepEqual(result, { count: 1, total: 2 })
})

test('全件達成時のチェック数は譜面数ではなくマス数となり、空マスや合計を含めない', () => {
  // Given
  const matrix = build(
    [
      createRecord({ id: 'pops-1', const: 14.5 }),
      createRecord({ id: 'pops-2', const: 14.9 }),
      createRecord({ id: 'orig-1', const: 13.2 }),
    ],
    'played'
  )

  // When
  const result = countUniFillMatrixChecks(matrix)

  // Then
  assert.deepEqual(result, { count: 2, total: 2 })
})

test('対象譜面がないマトリクスのチェック数は0 / 0となる', () => {
  // Given
  const matrix = build([], 'played', { levelConstAxis: 'chartConstant' })

  // When
  const result = countUniFillMatrixChecks(matrix)

  // Then
  assert.deepEqual(result, { count: 0, total: 0 })
})

test('画像ファイル名は難易度・埋め条件・縦軸・横軸・日時を含む小文字の名前になる', () => {
  // Given
  const date = new Date(2026, 9, 4, 9, 5, 7)
  const cases = [
    {
      condition: {
        difficulty: 'MASTER_ULTIMA',
        achievement: 'sssPlus',
        levelConstAxis: 'chartConstant',
        vertical: 'levelConst',
        horizontal: 'genre',
      },
      expected:
        'chunisupport-uni-fill-matrix-master-ultima-sssplus-chartconstant-genre-20261004090507.png',
    },
    {
      condition: {
        difficulty: 'MASTER',
        achievement: 'sss',
        levelConstAxis: 'level',
        vertical: 'nameFolder',
        horizontal: 'version',
      },
      expected: 'chunisupport-uni-fill-matrix-master-sss-name-version-20261004090507.png',
    },
  ] as const

  for (const { condition, expected } of cases) {
    // When
    const result = formatUniFillMatrixImageFilename(condition, date)

    // Then
    assert.equal(result, expected)
  }
})

/** 表示設定の正規化テストで使う既定値 */
const VIEW_SETTINGS_FALLBACK: UniFillMatrixViewSettings = {
  vertical: 'levelConst',
  horizontal: 'genre',
  levelConstAxis: 'level',
  showPercent: false,
}

test('保存済みの表示設定が正しい場合はそのまま復元されること', () => {
  // Given
  const saved = {
    vertical: 'version',
    horizontal: 'nameFolder',
    levelConstAxis: 'chartConstant',
    showPercent: true,
  }

  // When
  const result = normalizeUniFillMatrixViewSettings(saved, VIEW_SETTINGS_FALLBACK)

  // Then
  assert.deepEqual(result, saved)
})

test('表示設定が未保存または不正な形式の場合は既定値になること', () => {
  // Given
  const invalidValues = [null, 'levelConst', 1]

  // When
  const results = invalidValues.map((value) =>
    normalizeUniFillMatrixViewSettings(value, VIEW_SETTINGS_FALLBACK)
  )

  // Then
  for (const result of results) assert.deepEqual(result, VIEW_SETTINGS_FALLBACK)
})

test('項目ごとに不正値だけが既定値へ戻ること', () => {
  // Given
  const saved = {
    vertical: 'genre',
    horizontal: 'version',
    levelConstAxis: 'unknown',
    showPercent: 'true',
  }

  // When
  const result = normalizeUniFillMatrixViewSettings(saved, VIEW_SETTINGS_FALLBACK)

  // Then
  assert.deepEqual(result, {
    vertical: 'genre',
    horizontal: 'version',
    levelConstAxis: 'level',
    showPercent: false,
  })
})

test('縦軸と横軸が同じ属性または片方が不正な場合は両軸とも既定値になること', () => {
  // Given
  const sameAxes = { vertical: 'version', horizontal: 'version' }
  const invalidAxis = { vertical: 'version', horizontal: 'unknown' }

  // When
  const sameAxesResult = normalizeUniFillMatrixViewSettings(sameAxes, VIEW_SETTINGS_FALLBACK)
  const invalidAxisResult = normalizeUniFillMatrixViewSettings(invalidAxis, VIEW_SETTINGS_FALLBACK)

  // Then
  for (const result of [sameAxesResult, invalidAxisResult]) {
    assert.equal(result.vertical, 'levelConst')
    assert.equal(result.horizontal, 'genre')
  }
})
