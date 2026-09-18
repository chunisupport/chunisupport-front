import assert from 'node:assert/strict'
import test from 'node:test'
import type { MasterDataDTO, PlayerRecordDTO, SongDTO } from '../../../types/api'
import {
  calculateGoalChartMaxOverPower,
  calculateGoalOverPowerChartMax,
  calculateGoalOverPowerTotals,
} from './goalOverPower'

const MASTER_DATA: MasterDataDTO = {
  genres: [{ id: 1, name: 'POPS' }],
  difficulties: [
    { id: 1, name: 'BASIC' },
    { id: 2, name: 'ADVANCED' },
    { id: 3, name: 'EXPERT' },
    { id: 4, name: 'MASTER' },
    { id: 5, name: 'ULTIMA' },
  ],
  versions: [],
  account_types: [],
  rating_bands: [],
  achievement_types: [],
  possessions: [],
}

/**
 * OVER POWER目標テスト用のプレイヤーレコードを作る。
 *
 * @param overrides - テストごとに差し替えるレコード項目。
 * @returns 集計に使うプレイヤーレコード。
 */
const createRecord = (overrides: Partial<PlayerRecordDTO>): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: false,
  updated_at: null,
  id: 'song-1',
  difficulty: 'MASTER',
  title: 'Song',
  artist: 'Artist',
  const: 14.5,
  is_const_unknown: false,
  score: 1000000,
  rating: 16,
  overpower: 10,
  justice_count: null,
  overpower_percent: 50,
  img: '',
  clear_lamp: null,
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

/**
 * OVER POWER目標テスト用の楽曲を作る。
 *
 * @param overrides - テストごとに差し替える楽曲項目。
 * @returns 集計に使う楽曲。
 */
const createSong = (overrides: Partial<SongDTO>): SongDTO => ({
  id: 'song-1',
  title: 'Song',
  reading: null,
  genre: 'POPS',
  artist: 'Artist',
  release: '2024-01-01',
  bpm: 180,
  jacket: null,
  charts: {
    MASTER: { const: 14.5, notes: 400, is_const_unknown: false },
  },
  maxop: 87.5,
  is_maxop_unknown: false,
  op_target_difficulty: 'MASTER',
  is_new: false,
  ...overrides,
})

test('譜面定数から譜面別の理論OVER POWERを算出する', () => {
  // Given
  const chartConst = 14.5

  // When
  const result = calculateGoalChartMaxOverPower(chartConst)

  // Then
  assert.equal(result, 87.5)
})

test('通常条件では各譜面の定数から最大OVER POWER合計を算出する', () => {
  // Given
  const records = [createRecord({ const: 14.5 }), createRecord({ id: 'song-2', const: 13 })]
  const songs = [
    createSong({
      id: 'song-1',
      charts: { MASTER: { const: 14.5, notes: 400, is_const_unknown: false } },
    }),
    createSong({
      id: 'song-2',
      charts: { MASTER: { const: 13, notes: 300, is_const_unknown: false } },
      maxop: 80,
      op_target_difficulty: 'MASTER',
    }),
  ]

  // When
  const result = calculateGoalOverPowerChartMax(records, songs, {}, [], MASTER_DATA)

  // Then
  assert.equal(result, 167.5)
})

test('OP対象条件では同一曲を重複せず楽曲マスタの最大OVER POWERで合計する', () => {
  // Given
  const records = [createRecord({ difficulty: 'MASTER' }), createRecord({ difficulty: 'ULTIMA' })]
  const songs = [
    createSong({
      maxop: 95,
      op_target_difficulty: 'ULTIMA',
      charts: {
        MASTER: { const: 14.5, notes: 400, is_const_unknown: false },
        ULTIMA: { const: 16, notes: 500, is_const_unknown: false },
      },
    }),
  ]

  // When
  const result = calculateGoalOverPowerChartMax(
    records,
    songs,
    { chart_target: 'OP_TARGET' },
    [],
    MASTER_DATA
  )

  // Then
  assert.equal(result, 95)
})

test('通常未解禁曲はOVER POWER目標の現在値と理論値から除外する', () => {
  // Given
  const records = [
    createRecord({ id: 'locked', overpower: 85, is_op_target: true }),
    createRecord({ id: 'available', overpower: 70, const: 13, is_op_target: true }),
  ]
  const songs = [
    createSong({ id: 'locked', maxop: 87.5 }),
    createSong({
      id: 'available',
      charts: { MASTER: { const: 13, notes: 300, is_const_unknown: false } },
      maxop: 80,
    }),
  ]

  // When
  const result = calculateGoalOverPowerTotals({
    records,
    songs,
    versions: [],
    masterData: MASTER_DATA,
    attributes: { chart_target: 'OP_TARGET' },
    lockedSongs: [{ display_id: 'locked', is_ultima: false }],
  })

  // Then
  assert.equal(result.current, 70)
  assert.equal(result.max, 80)
})

test('ULTIMA未解禁はULTIMA譜面だけを除外し理論値を残譜面へ落とす', () => {
  // Given
  const records = [
    createRecord({
      id: 'song-a',
      difficulty: 'MASTER',
      overpower: 80,
      const: 14,
      is_op_target: true,
    }),
    createRecord({
      id: 'song-a',
      difficulty: 'ULTIMA',
      overpower: 92,
      const: 16,
      is_op_target: false,
    }),
  ]
  const songs = [
    createSong({
      id: 'song-a',
      maxop: 95,
      op_target_difficulty: 'ULTIMA',
      charts: {
        MASTER: { const: 14, notes: 400, is_const_unknown: false },
        ULTIMA: { const: 16, notes: 500, is_const_unknown: false },
      },
    }),
  ]

  // When
  const result = calculateGoalOverPowerTotals({
    records,
    songs,
    versions: [],
    masterData: MASTER_DATA,
    attributes: { chart_target: 'OP_TARGET' },
    lockedSongs: [{ display_id: 'song-a', is_ultima: true }],
  })

  // Then
  assert.equal(result.current, 80)
  assert.equal(result.max, 85)
})

test('MASTER指定の目標ではULTIMA未解禁でもMASTER譜面の理論値を維持する', () => {
  // Given
  const records = [
    createRecord({ difficulty: 'MASTER', overpower: 80, const: 14 }),
    createRecord({ difficulty: 'ULTIMA', overpower: 92, const: 16 }),
  ]
  const songs = [
    createSong({
      maxop: 95,
      op_target_difficulty: 'ULTIMA',
      charts: {
        MASTER: { const: 14, notes: 400, is_const_unknown: false },
        ULTIMA: { const: 16, notes: 500, is_const_unknown: false },
      },
    }),
  ]

  // When
  const result = calculateGoalOverPowerTotals({
    records,
    songs,
    versions: [],
    masterData: MASTER_DATA,
    attributes: { diff: [4] },
    lockedSongs: [{ display_id: 'song-1', is_ultima: true }],
  })

  // Then
  assert.equal(result.current, 80)
  assert.equal(result.max, 85)
})

test('ULTIMA未解禁で理論OP対象が残譜面へ落ちた曲は定数条件から外れる', () => {
  // Given
  const records = [
    createRecord({ difficulty: 'MASTER', overpower: 80, const: 14, is_op_target: true }),
    createRecord({ difficulty: 'ULTIMA', overpower: 92, const: 16, is_op_target: false }),
  ]
  const songs = [
    createSong({
      maxop: 95,
      op_target_difficulty: 'ULTIMA',
      charts: {
        MASTER: { const: 14, notes: 400, is_const_unknown: false },
        ULTIMA: { const: 16, notes: 500, is_const_unknown: false },
      },
    }),
  ]

  // When
  const result = calculateGoalOverPowerTotals({
    records,
    songs,
    versions: [],
    masterData: MASTER_DATA,
    attributes: { chart_target: 'OP_TARGET', const: { min: 15 } },
    lockedSongs: [{ display_id: 'song-1', is_ultima: true }],
  })

  // Then
  assert.equal(result.current, 0)
  assert.equal(result.max, 0)
})
