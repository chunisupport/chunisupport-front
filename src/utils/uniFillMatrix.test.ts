import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO } from '../types/api'
import { buildUniFillMatrix } from './uniFillMatrix'

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
      cells: [
        { count: 1, total: 2 },
        { count: 0, total: 0 },
      ],
      total: { count: 1, total: 2 },
    },
    {
      genre: 'ORIGINAL',
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
