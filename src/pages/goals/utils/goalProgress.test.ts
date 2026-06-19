import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalDTO, PlayerRecordDTO, SongDTO } from '../../../types/api'
import { calculateGoalProgress } from './goalProgress'

/**
 * 目標進捗テスト用のプレイヤーレコードを作る。
 *
 * @param overrides - テストごとに差し替えるレコード項目。
 * @returns 目標進捗計算に使うプレイヤーレコード。
 */
const createRecord = (overrides: Partial<PlayerRecordDTO>): PlayerRecordDTO => ({
  is_played: true,
  updated_at: null,
  difficulty: 'MASTER',
  id: 'song-1',
  title: 'Song',
  artist: 'Artist',
  const: 14,
  is_const_unknown: false,
  score: 1000000,
  rating: 16,
  overpower: 5,
  justice_count: null,
  overpower_percent: 41.67,
  img: '',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

/**
 * 目標進捗テスト用の楽曲を作る。
 *
 * @param overrides - テストごとに差し替える楽曲項目。
 * @returns 目標進捗計算に使う楽曲。
 */
const createSong = (overrides: Partial<SongDTO>): SongDTO => ({
  id: 'song-1',
  title: 'Song',
  reading: null,
  artist: 'Artist',
  genre: 'POPS',
  bpm: null,
  release: null,
  jacket: null,
  maxop: 10,
  is_maxop_unknown: false,
  op_target_difficulty: null,
  charts: {},
  ...overrides,
})

/**
 * 目標進捗テスト用のGoal DTOを作る。
 *
 * @param overrides - テストごとに差し替える目標項目。
 * @returns 目標進捗計算に使うGoal DTO。
 */
const createGoal = (overrides: Partial<GoalDTO>): GoalDTO => ({
  id: 1,
  title: 'goal',
  achievement_type: 'score_count',
  achievement_params: { score: 1000000 },
  attributes: {},
  invert: false,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

test('件数目標のcountが欠落している場合は現在の対象譜面数を目標値にする', () => {
  const records = [
    createRecord({ id: 'song-1', score: 1000000 }),
    createRecord({ id: 'song-2', score: 990000 }),
    createRecord({ id: 'song-3', score: 1000000 }),
  ]
  const goal = createGoal({
    achievement_params: { score: 1000000 },
  })

  const progress = calculateGoalProgress(goal, records, [])

  assert.equal(progress.current, 2)
  assert.equal(progress.target, 3)
  assert.equal(progress.percent, (2 / 3) * 100)
  assert.equal(progress.achieved, false)
})

test('件数目標のcountが指定されている場合は固定目標値を維持する', () => {
  const records = [
    createRecord({ id: 'song-1', score: 1000000 }),
    createRecord({ id: 'song-2', score: 1000000 }),
    createRecord({ id: 'song-3', score: 990000 }),
  ]
  const goal = createGoal({
    achievement_params: { score: 1000000, count: 2 },
  })

  const progress = calculateGoalProgress(goal, records, [])

  assert.equal(progress.current, 2)
  assert.equal(progress.target, 2)
  assert.equal(progress.achieved, true)
})

test('総スコア目標のtotalが欠落している場合は対象譜面数から理論値を計算する', () => {
  const records = [
    createRecord({ id: 'song-1', score: 1010000 }),
    createRecord({ id: 'song-2', score: 1000000 }),
  ]
  const goal = createGoal({
    achievement_type: 'total_score',
    achievement_params: {},
  })

  const progress = calculateGoalProgress(goal, records, [])

  assert.equal(progress.current, 2010000)
  assert.equal(progress.target, 2020000)
})

test('OVER POWER合計目標のtotalが欠落している場合は対象譜面の理論値合計を使う', () => {
  const records = [
    createRecord({ id: 'song-1', overpower: 9 }),
    createRecord({ id: 'song-2', overpower: 7 }),
  ]
  const songs = [createSong({ id: 'song-1', maxop: 10 }), createSong({ id: 'song-2', maxop: 8 })]
  const goal = createGoal({
    achievement_type: 'overpower_value',
    achievement_params: {},
  })

  const progress = calculateGoalProgress(goal, records, songs)

  assert.equal(progress.current, 16)
  assert.equal(progress.target, 18)
})
