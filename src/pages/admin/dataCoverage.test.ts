import assert from 'node:assert/strict'
import test from 'node:test'
import type { SongDTO, WorldsendSongDTO } from '../../types/api'
import {
  buildChartConstantCoverage,
  buildChartMetadataCoverage,
  type MissingChartMetadataEntry,
  sortMissingCharts,
  sortUnknownCharts,
  type UnknownChartConstantEntry,
} from './dataCoverage'

/**
 * テスト用の通常楽曲を生成する。
 *
 * @param id - 楽曲ID。
 * @param charts - 難易度別譜面情報。
 * @param overrides - 曲名と読みの上書き。
 * @returns 集計テストに必要な最小限の通常楽曲。
 */
const createSong = (
  id: string,
  charts: SongDTO['charts'],
  overrides?: { title?: string; reading?: string | null }
): SongDTO => ({
  id,
  title: overrides?.title ?? `楽曲${id}`,
  reading: overrides?.reading ?? null,
  artist: 'アーティスト',
  genre: 'ジャンル',
  bpm: null,
  release: null,
  jacket: null,
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: null,
  is_new: false,
  charts,
})

/**
 * テスト用のWORLD'S END楽曲を生成する。
 *
 * @param id - 楽曲ID。
 * @param chart - WORLD'S END譜面情報。
 * @param overrides - 曲名と読みの上書き。
 * @returns 集計テストに必要な最小限のWORLD'S END楽曲。
 */
const createWorldsendSong = (
  id: string,
  chart: WorldsendSongDTO['charts']['WORLDSEND'],
  overrides?: { title?: string; reading?: string | null }
): WorldsendSongDTO => ({
  id,
  title: overrides?.title ?? `WORLD'S END楽曲${id}`,
  reading: overrides?.reading ?? null,
  artist: 'アーティスト',
  genre: 'ジャンル',
  bpm: null,
  release: null,
  official_idx: id,
  jacket: null,
  is_new: false,
  charts: chart ? { WORLDSEND: chart } : {},
})

test('レベル10以上に存在する譜面だけを母数として難易度別・レベル別に集計すること', () => {
  // Given
  const songs = [
    createSong('1', {
      BASIC: { const: 3, is_const_unknown: true, notes: null },
      MASTER: { const: 13.4, is_const_unknown: false, notes: null },
    }),
    createSong('2', {
      MASTER: { const: 13.7, is_const_unknown: true, notes: null },
      ULTIMA: { const: 14.5, is_const_unknown: false, notes: null },
    }),
  ]

  // When
  const result = buildChartConstantCoverage(songs)

  // Then
  assert.deepEqual(result.overall, { known: 2, total: 3, percent: (2 / 3) * 100 })
  assert.deepEqual(result.byDifficulty.BASIC, {
    known: 0,
    total: 0,
    percent: 0,
  })
  assert.deepEqual(result.byDifficulty.ADVANCED, {
    known: 0,
    total: 0,
    percent: 0,
  })
  assert.deepEqual(
    result.rows.map((row) => ({
      level: row.level,
      known: row.total.known,
      total: row.total.total,
    })),
    [
      { level: '13', known: 1, total: 1 },
      { level: '13+', known: 0, total: 1 },
      { level: '14+', known: 1, total: 1 },
    ]
  )
  assert.deepEqual(result.unknownCharts, [
    {
      songId: '2',
      songTitle: '楽曲2',
      songReading: null,
      difficulty: 'MASTER',
      level: '13+',
    },
  ])
})

test('未判明譜面を推定定数から算出したレベルへ分類すること', () => {
  // Given
  const songs = [
    createSong('2', {
      MASTER: { const: 13.7, is_const_unknown: true, notes: null },
    }),
  ]

  // When
  const result = buildChartConstantCoverage(songs)

  // Then
  assert.deepEqual(result.rows[0], {
    level: '13+',
    byDifficulty: {
      BASIC: { known: 0, total: 0, percent: 0 },
      ADVANCED: { known: 0, total: 0, percent: 0 },
      EXPERT: { known: 0, total: 0, percent: 0 },
      MASTER: { known: 0, total: 1, percent: 0 },
      ULTIMA: { known: 0, total: 0, percent: 0 },
    },
    total: { known: 0, total: 1, percent: 0 },
  })
  assert.deepEqual(result.unknownCharts, [
    {
      songId: '2',
      songTitle: '楽曲2',
      songReading: null,
      difficulty: 'MASTER',
      level: '13+',
    },
  ])
})

test('充足率は切り捨て前の値を保持すること', () => {
  // Given
  const songs = [
    createSong('1', {
      EXPERT: { const: 12, is_const_unknown: false, notes: null },
    }),
    createSong('2', {
      EXPERT: { const: 12.1, is_const_unknown: false, notes: null },
    }),
    createSong('3', {
      EXPERT: { const: 12.2, is_const_unknown: true, notes: null },
    }),
  ]

  // When
  const result = buildChartConstantCoverage(songs)

  // Then
  assert.equal(result.overall.percent, (2 / 3) * 100)
})

test("ノーツ数は存在する通常譜面とWORLD'S END譜面を集計すること", () => {
  // Given
  const songs = [
    createSong('1', {
      BASIC: { const: 3, is_const_unknown: false, notes: 0 },
      ADVANCED: { const: 7, is_const_unknown: false, notes: null },
      EXPERT: { const: 11, is_const_unknown: false, notes: 800 },
      MASTER: { const: 13, is_const_unknown: false, notes: 1200 },
    }),
    createSong('2', {
      BASIC: { const: 4, is_const_unknown: false, notes: 300 },
      ADVANCED: { const: 8, is_const_unknown: false, notes: 500 },
      EXPERT: { const: 12, is_const_unknown: false, notes: 700 },
      MASTER: { const: 13.5, is_const_unknown: false, notes: 1000 },
      ULTIMA: { const: 14, is_const_unknown: false, notes: null },
    }),
  ]
  const worldsendSongs = [
    createWorldsendSong('1', {
      attribute: '狂',
      level_star: 3,
      notes: 900,
      notes_designer: null,
    }),
    createWorldsendSong('2', {
      attribute: '改',
      level_star: 4,
      notes: null,
      notes_designer: null,
    }),
  ]

  // When
  const result = buildChartMetadataCoverage(songs, worldsendSongs, 'notes')

  // Then
  assert.deepEqual(result.overall, { known: 8, total: 11, percent: (8 / 11) * 100 })
  assert.deepEqual(result.byDifficulty.BASIC, { known: 2, total: 2, percent: 100 })
  assert.deepEqual(result.byDifficulty.ADVANCED, { known: 1, total: 2, percent: 50 })
  assert.deepEqual(result.byDifficulty.WORLDS_END, { known: 1, total: 2, percent: 50 })
  assert.deepEqual(result.missingCharts, [
    { songId: '1', songTitle: '楽曲1', songReading: null, difficulty: 'ADVANCED' },
    { songId: '2', songTitle: '楽曲2', songReading: null, difficulty: 'ULTIMA' },
    { songId: '2', songTitle: "WORLD'S END楽曲2", songReading: null, difficulty: 'WORLDS_END' },
  ])
})

test("NOTES DESIGNERはBASICとADVANCEDを除外してWORLD'S ENDを含めること", () => {
  // Given
  const songs = [
    createSong('1', {
      BASIC: {
        const: 3,
        is_const_unknown: false,
        notes: 300,
        notes_designer: null,
      },
      ADVANCED: {
        const: 7,
        is_const_unknown: false,
        notes: 500,
        notes_designer: '',
      },
      EXPERT: {
        const: 12,
        is_const_unknown: false,
        notes: 800,
        notes_designer: '譜面作者A',
      },
      MASTER: {
        const: 13,
        is_const_unknown: false,
        notes: 1000,
        notes_designer: '   ',
      },
    }),
    createSong('2', {
      EXPERT: {
        const: 12,
        is_const_unknown: false,
        notes: 900,
        notes_designer: '譜面作者B',
      },
      MASTER: {
        const: 13.5,
        is_const_unknown: false,
        notes: 1100,
        notes_designer: '譜面作者C',
      },
      ULTIMA: {
        const: 14,
        is_const_unknown: false,
        notes: 1200,
        notes_designer: null,
      },
    }),
  ]
  const worldsendSongs = [
    createWorldsendSong('1', {
      attribute: '狂',
      level_star: 3,
      notes: 900,
      notes_designer: '譜面作者WE',
    }),
  ]

  // When
  const result = buildChartMetadataCoverage(songs, worldsendSongs, 'notesDesigner')

  // Then
  assert.deepEqual(result.overall, { known: 4, total: 6, percent: (4 / 6) * 100 })
  assert.deepEqual(result.byDifficulty.BASIC, { known: 0, total: 0, percent: 0 })
  assert.deepEqual(result.byDifficulty.ADVANCED, { known: 0, total: 0, percent: 0 })
  assert.deepEqual(result.byDifficulty.EXPERT, { known: 2, total: 2, percent: 100 })
  assert.deepEqual(result.byDifficulty.MASTER, { known: 1, total: 2, percent: 50 })
  assert.deepEqual(result.byDifficulty.ULTIMA, { known: 0, total: 1, percent: 0 })
  assert.deepEqual(result.byDifficulty.WORLDS_END, { known: 1, total: 1, percent: 100 })
  assert.deepEqual(result.missingCharts, [
    { songId: '1', songTitle: '楽曲1', songReading: null, difficulty: 'MASTER' },
    { songId: '2', songTitle: '楽曲2', songReading: null, difficulty: 'ULTIMA' },
  ])
})

test('必須譜面自体の欠落は未登録として扱いULTIMAの欠落は母数から除外すること', () => {
  // Given
  const songs = [createSong('1', {})]
  const worldsendSongs = [createWorldsendSong('1', undefined)]

  // When
  const notes = buildChartMetadataCoverage(songs, worldsendSongs, 'notes')
  const notesDesigner = buildChartMetadataCoverage(songs, worldsendSongs, 'notesDesigner')

  // Then
  assert.deepEqual(notes.overall, { known: 0, total: 5, percent: 0 })
  assert.deepEqual(notes.missingCharts, [
    { songId: '1', songTitle: '楽曲1', songReading: null, difficulty: 'BASIC' },
    { songId: '1', songTitle: '楽曲1', songReading: null, difficulty: 'ADVANCED' },
    { songId: '1', songTitle: '楽曲1', songReading: null, difficulty: 'EXPERT' },
    { songId: '1', songTitle: '楽曲1', songReading: null, difficulty: 'MASTER' },
    { songId: '1', songTitle: "WORLD'S END楽曲1", songReading: null, difficulty: 'WORLDS_END' },
  ])
  assert.deepEqual(notesDesigner.overall, { known: 0, total: 3, percent: 0 })
  assert.deepEqual(notesDesigner.missingCharts, [
    { songId: '1', songTitle: '楽曲1', songReading: null, difficulty: 'EXPERT' },
    { songId: '1', songTitle: '楽曲1', songReading: null, difficulty: 'MASTER' },
    { songId: '1', songTitle: "WORLD'S END楽曲1", songReading: null, difficulty: 'WORLDS_END' },
  ])
})

/**
 * ソート用の未判明譜面を生成する。
 *
 * @param songId - 楽曲表示ID。
 * @param songTitle - 楽曲名。
 * @param difficulty - 譜面難易度。
 * @param level - 譜面レベル。
 * @param songReading - 楽曲の読み。省略時はnull。
 * @returns ソートテスト用の未判明譜面。
 */
const createUnknownChart = (
  songId: string,
  songTitle: string,
  difficulty: UnknownChartConstantEntry['difficulty'],
  level: UnknownChartConstantEntry['level'],
  songReading: string | null = null
): UnknownChartConstantEntry => ({ songId, songTitle, songReading, difficulty, level })

/**
 * ソート用の未登録譜面を生成する。
 *
 * @param songId - 楽曲表示ID。
 * @param songTitle - 楽曲名。
 * @param difficulty - 譜面区分。
 * @param songReading - 楽曲の読み。省略時はnull。
 * @returns ソートテスト用の未登録譜面。
 */
const createMissingChart = (
  songId: string,
  songTitle: string,
  difficulty: MissingChartMetadataEntry['difficulty'],
  songReading: string | null = null
): MissingChartMetadataEntry => ({ songId, songTitle, songReading, difficulty })

test('未判明譜面を曲名の昇順と降順で並べ替えられること', () => {
  // Given: 曲名順とは異なる並びの未判明譜面。
  const charts = [
    createUnknownChart('2', '楽曲い', 'MASTER', '13+'),
    createUnknownChart('1', '楽曲あ', 'EXPERT', '13'),
  ]

  // When: 曲名で昇順と降順に並べ替える。
  const ascending = sortUnknownCharts(charts, 'songTitle', 'asc')
  const descending = sortUnknownCharts(charts, 'songTitle', 'desc')

  // Then: 曲名順に並び、元の配列は変更されないこと。
  assert.deepEqual(
    ascending.map((chart) => chart.songTitle),
    ['楽曲あ', '楽曲い']
  )
  assert.deepEqual(
    descending.map((chart) => chart.songTitle),
    ['楽曲い', '楽曲あ']
  )
  assert.equal(charts[0]?.songTitle, '楽曲い')
})

test('未判明譜面を難易度とLvで並べ替えられること', () => {
  // Given: 難易度とレベルが混在する未判明譜面。
  const charts = [
    createUnknownChart('3', '楽曲う', 'ULTIMA', '14+'),
    createUnknownChart('1', '楽曲あ', 'MASTER', '13+'),
    createUnknownChart('2', '楽曲い', 'EXPERT', '13'),
  ]

  // When: 難易度とLvで昇順に並べ替える。
  const byDifficulty = sortUnknownCharts(charts, 'difficulty', 'asc')
  const byLevel = sortUnknownCharts(charts, 'level', 'asc')

  // Then: 難易度順とレベル順に並ぶこと。
  assert.deepEqual(
    byDifficulty.map((chart) => chart.difficulty),
    ['EXPERT', 'MASTER', 'ULTIMA']
  )
  assert.deepEqual(
    byLevel.map((chart) => chart.level),
    ['13', '13+', '14+']
  )
})

test('未登録譜面を曲名と難易度で並べ替えられること', () => {
  // Given: WORLD'S ENDを含む未登録譜面。
  const charts = [
    createMissingChart('3', "WORLD'S END楽曲う", 'WORLDS_END'),
    createMissingChart('2', '楽曲い', 'ULTIMA'),
    createMissingChart('1', '楽曲あ', 'BASIC'),
  ]

  // When: 難易度で昇順、曲名で降順に並べ替える。
  const byDifficulty = sortMissingCharts(charts, 'difficulty', 'asc')
  const byTitleDescending = sortMissingCharts(charts, 'songTitle', 'desc')

  // Then: 難易度順に並び、WORLD'S ENDが末尾になること。
  assert.deepEqual(
    byDifficulty.map((chart) => chart.difficulty),
    ['BASIC', 'ULTIMA', 'WORLDS_END']
  )
  assert.deepEqual(
    byTitleDescending.map((chart) => chart.songTitle),
    ['楽曲い', '楽曲あ', "WORLD'S END楽曲う"]
  )
})

test('ソート未指定時は既定順を維持した複製を返すこと', () => {
  // Given: 既定順の未判明譜面と未登録譜面。
  const unknownCharts = [createUnknownChart('1', '楽曲あ', 'MASTER', '13+')]
  const missingCharts = [createMissingChart('1', '楽曲あ', 'BASIC')]

  // When: ソートキーまたは方向を指定しない。
  const unknownResult = sortUnknownCharts(unknownCharts, null, null)
  const missingResult = sortMissingCharts(missingCharts, 'songTitle', null)

  // Then: 既定順のまま新しい配列で返ること。
  assert.deepEqual(unknownResult, unknownCharts)
  assert.deepEqual(missingResult, missingCharts)
  assert.notEqual(unknownResult, unknownCharts)
  assert.notEqual(missingResult, missingCharts)
})

test('未判明譜面の既定順は曲名ではなく読みベースで並ぶこと', () => {
  // Given: 同一レベル・同一難易度で曲名順と読み順が異なる楽曲。
  const songs = [
    createSong(
      '1',
      { MASTER: { const: 13.5, is_const_unknown: true, notes: null } },
      { title: '林檎', reading: 'リンゴ' }
    ),
    createSong(
      '2',
      { MASTER: { const: 13.5, is_const_unknown: true, notes: null } },
      { title: '愛', reading: 'ラブ' }
    ),
    createSong(
      '3',
      { MASTER: { const: 13.5, is_const_unknown: true, notes: null } },
      { title: '空', reading: 'ソラ' }
    ),
  ]

  // When: 譜面定数の充足状況を集計する。
  const result = buildChartConstantCoverage(songs)

  // Then: 読みの順に並び、読みが保持されること。
  assert.deepEqual(
    result.unknownCharts.map((chart) => chart.songTitle),
    ['空', '愛', '林檎']
  )
  assert.deepEqual(
    result.unknownCharts.map((chart) => chart.songReading),
    ['ソラ', 'ラブ', 'リンゴ']
  )
})

test('未判明譜面の曲名ソートは読みベースで並ぶこと', () => {
  // Given: 曲名順と読み順が異なる未判明譜面。
  const charts = [
    createUnknownChart('1', '林檎', 'MASTER', '13+', 'リンゴ'),
    createUnknownChart('2', '愛', 'MASTER', '13+', 'ラブ'),
    createUnknownChart('3', '空', 'MASTER', '13+', 'ソラ'),
  ]

  // When: 曲名で昇順と降順に並べ替える。
  const ascending = sortUnknownCharts(charts, 'songTitle', 'asc')
  const descending = sortUnknownCharts(charts, 'songTitle', 'desc')

  // Then: 読みの順に並ぶこと。
  assert.deepEqual(
    ascending.map((chart) => chart.songTitle),
    ['空', '愛', '林檎']
  )
  assert.deepEqual(
    descending.map((chart) => chart.songTitle),
    ['林檎', '愛', '空']
  )
})

test('未登録譜面の既定順は曲名ではなく読みベースで並ぶこと', () => {
  // Given: 同一譜面区分で曲名順と読み順が異なる楽曲。
  const songs = [
    createSong(
      '1',
      { BASIC: { const: 3, is_const_unknown: false, notes: null } },
      { title: '林檎', reading: 'リンゴ' }
    ),
    createSong(
      '2',
      { BASIC: { const: 3, is_const_unknown: false, notes: null } },
      { title: '愛', reading: 'ラブ' }
    ),
    createSong(
      '3',
      { BASIC: { const: 3, is_const_unknown: false, notes: null } },
      { title: '空', reading: 'ソラ' }
    ),
  ]

  // When: ノーツ数の充足状況を集計する。
  const result = buildChartMetadataCoverage(songs, [], 'notes')

  // Then: 同一難易度内は読みの順に並ぶこと。
  assert.deepEqual(
    result.missingCharts
      .filter((chart) => chart.difficulty === 'BASIC')
      .map((chart) => chart.songTitle),
    ['空', '愛', '林檎']
  )
})

test('未登録譜面の曲名ソートは読みベースで並ぶこと', () => {
  // Given: 曲名順と読み順が異なる未登録譜面。
  const charts = [
    createMissingChart('1', '林檎', 'BASIC', 'リンゴ'),
    createMissingChart('2', '愛', 'BASIC', 'ラブ'),
    createMissingChart('3', '空', 'BASIC', 'ソラ'),
  ]

  // When: 曲名で昇順と降順に並べ替える。
  const ascending = sortMissingCharts(charts, 'songTitle', 'asc')
  const descending = sortMissingCharts(charts, 'songTitle', 'desc')

  // Then: 読みの順に並ぶこと。
  assert.deepEqual(
    ascending.map((chart) => chart.songTitle),
    ['空', '愛', '林檎']
  )
  assert.deepEqual(
    descending.map((chart) => chart.songTitle),
    ['林檎', '愛', '空']
  )
})
