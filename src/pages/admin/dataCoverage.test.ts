import assert from 'node:assert/strict'
import test from 'node:test'
import type { SongDTO } from '../../types/api'
import { buildChartConstantCoverage } from './dataCoverage'

/**
 * テスト用の通常楽曲を生成する。
 *
 * @param id - 楽曲ID。
 * @param charts - 難易度別譜面情報。
 * @returns 集計テストに必要な最小限の通常楽曲。
 */
const createSong = (id: string, charts: SongDTO['charts']): SongDTO => ({
  id,
  title: `楽曲${id}`,
  reading: null,
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
      songTitle: '楽曲2',
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
      songTitle: '楽曲2',
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
