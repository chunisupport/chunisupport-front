import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO } from '../types/api'
import {
  filterRatingReachableRecords,
  resolveRatingGoalMinimumChartConstant,
} from './goalRatingCount'

/**
 * 単曲レート目標テスト用のプレイヤーレコードを作る。
 *
 * @param overrides - テストごとに差し替えるレコード項目。
 * @returns 到達可能譜面の判定に使うプレイヤーレコード。
 */
const createRecord = (overrides: Partial<PlayerRecordDTO>): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: false,
  updated_at: null,
  difficulty: 'MASTER',
  id: 'song-1',
  title: 'Song',
  artist: 'Artist',
  const: 15.9,
  is_const_unknown: false,
  score: 1_010_000,
  rating: 18,
  overpower: 0,
  justice_count: null,
  overpower_percent: 0,
  img: '',
  clear_lamp: null,
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

test('単曲レート18は理論値で到達できる定数15.9以上だけを対象にする', () => {
  // Given
  const records = [
    createRecord({ id: 'unreachable', const: 15.8 }),
    createRecord({ id: 'boundary', const: 15.9 }),
    createRecord({ id: 'above', const: 16 }),
    createRecord({ id: 'unknown', const: 16, is_const_unknown: true }),
  ]

  // When
  const result = filterRatingReachableRecords(records, 18)

  // Then
  assert.deepEqual(
    result.map((record) => record.id),
    ['boundary', 'above']
  )
})

test('単曲レート目標から0.1刻みの到達可能定数下限を解決する', () => {
  // Given / When / Then
  assert.equal(resolveRatingGoalMinimumChartConstant(18), 15.9)
  assert.equal(resolveRatingGoalMinimumChartConstant(17.45), 15.3)
  assert.equal(resolveRatingGoalMinimumChartConstant(1), 1)
})
