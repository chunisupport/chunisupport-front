import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO, SongDTO } from '../../../types/api'
import { calculateGoalChartMaxOverPower, calculateGoalOverPowerChartMax } from './goalOverPower'

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
    BASIC: { const: 1, notes: 100, is_const_unknown: false },
    ADVANCED: { const: 5, notes: 200, is_const_unknown: false },
    EXPERT: { const: 9, notes: 300, is_const_unknown: false },
    MASTER: { const: 14.5, notes: 400, is_const_unknown: false },
    ULTIMA: { const: 14.9, notes: 500, is_const_unknown: false },
  },
  maxop: 95,
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

  // When
  const result = calculateGoalOverPowerChartMax(records, [], {})

  // Then
  assert.equal(result, 167.5)
})

test('OP対象条件では同一曲を重複せず楽曲マスタの最大OVER POWERで合計する', () => {
  // Given
  const records = [createRecord({ difficulty: 'MASTER' }), createRecord({ difficulty: 'ULTIMA' })]
  const songs = [createSong({ maxop: 95 })]

  // When
  const result = calculateGoalOverPowerChartMax(records, songs, { chart_target: 'OP_TARGET' })

  // Then
  assert.equal(result, 95)
})
