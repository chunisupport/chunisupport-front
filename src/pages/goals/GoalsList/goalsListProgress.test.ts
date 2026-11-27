import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalCreateRequest, GoalDTO, PlayerRecordDTO, SongDTO } from '../../../types/api'
import {
  buildGoalsWithProgress,
  isOverPowerAchievementType,
  resolveDraftGoalProgress,
  resolveGoalAllCount,
  resolveGoalOverPowerChartMax,
} from './goalsListProgress'
import type { GoalsListData } from './goalsListResource'

/**
 * 下書き件数テスト用のプレイヤーレコードを作る。
 *
 * @param overrides - テストごとに差し替えるレコード項目。
 * @returns 目標対象件数の解決に使うプレイヤーレコード。
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

test('OVER POWER系の目標種別を判定する', () => {
  // Given / When / Then
  assert.equal(isOverPowerAchievementType('overpower_value'), true)
  assert.equal(isOverPowerAchievementType('overpower_percent'), true)
  assert.equal(isOverPowerAchievementType('rank_count'), false)
})

test('データ未取得時の下書き進捗は未達成の初期値を返す', () => {
  // Given
  const draftGoal = {
    group_id: null,
    title: '下書き',
    achievement_type: 'score_count',
    achievement_params: { score: 1000000, count: 1 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
  } satisfies GoalCreateRequest

  // When
  const result = resolveDraftGoalProgress(undefined, draftGoal)

  // Then
  assert.deepEqual(result, {
    current: 0,
    target: 1,
    percent: 0,
    achieved: false,
    targetCount: 0,
    hasUnknownMaxOp: false,
  })
})

test('OVER POWER目標の対象数と理論値に同じ未解禁設定を反映する', () => {
  // Given: プレイ済みの未解禁譜面と、未プレイの解禁済み譜面がある。
  const songs: SongDTO[] = ['locked', 'unplayed'].map((id) => ({
    id,
    title: id,
    reading: null,
    name_folder_code: 'NUMBER',
    genre: 'POPS',
    artist: 'Artist',
    release: '2024-01-01',
    bpm: 180,
    jacket: null,
    charts: { MASTER: { const: 14, notes: 400, is_const_unknown: false } },
    maxop: 85,
    is_maxop_unknown: false,
    op_target_difficulty: 'MASTER',
    is_new: false,
    unlock_required: false,
  }))
  const data = {
    username: 'player',
    noPlayerData: false,
    goals: [],
    groups: [],
    songs,
    masterData: {
      difficulties: [],
      genres: [],
      versions: [],
      name_folders: [],
      account_types: [],
      rating_bands: [],
      achievement_types: [],
      possessions: [],
    },
    versions: [],
    records: [
      createRecord({ id: 'locked', const: 14 }),
      createRecord({ id: 'unplayed', const: 14, is_played: false, score: 0 }),
    ],
    lockedSongs: [{ id: 'locked', is_ultima: false }],
  } satisfies GoalsListData
  const attributes = { const: { min: 14, max: 14.4 } }

  // When / Then
  assert.equal(resolveGoalAllCount(data, attributes, 'overpower_value'), 1)
  assert.equal(resolveGoalAllCount(data, attributes, 'overpower_percent'), 1)
  assert.equal(resolveGoalOverPowerChartMax(data, attributes), 85)
})

test('単曲レート入力の変更に応じて到達可能譜面数を再解決できる', () => {
  // Given
  const data = {
    username: 'player',
    noPlayerData: false,
    goals: [],
    groups: [],
    songs: [],
    masterData: {
      difficulties: [],
      genres: [],
      versions: [],
      name_folders: [],
      account_types: [],
      rating_bands: [],
      achievement_types: [],
      possessions: [],
    },
    versions: [],
    records: [createRecord({ id: '15.8', const: 15.8 }), createRecord({ id: '15.9', const: 15.9 })],
    lockedSongs: [],
  } satisfies GoalsListData

  // When
  const rating18Count = resolveGoalAllCount(data, {}, 'rating_count', { rating: 18 })
  const rating1795Count = resolveGoalAllCount(data, {}, 'rating_count', { rating: 17.95 })

  // Then
  assert.equal(rating18Count, 1)
  assert.equal(rating1795Count, 2)
})

test('単曲レート未指定では到達可能な全譜面を数える', () => {
  // Given
  const data = {
    username: 'player',
    noPlayerData: false,
    goals: [],
    groups: [],
    songs: [],
    masterData: {
      difficulties: [],
      genres: [],
      versions: [],
      name_folders: [],
      account_types: [],
      rating_bands: [],
      achievement_types: [],
      possessions: [],
    },
    versions: [],
    records: [createRecord({ id: '15.8', const: 15.8 }), createRecord({ id: '15.9', const: 15.9 })],
    lockedSongs: [],
  } satisfies GoalsListData

  // When
  const result = resolveGoalAllCount(data, {}, 'rating_count')

  // Then
  assert.equal(result, 2)
})

test('虹枠の下書き進捗は対象楽曲数で計算する', () => {
  // Given
  const data = {
    username: 'player',
    noPlayerData: false,
    goals: [],
    groups: [],
    songs: [],
    masterData: {
      difficulties: [],
      genres: [],
      versions: [],
      name_folders: [],
      account_types: [],
      rating_bands: [],
      achievement_types: [],
      possessions: [],
    },
    versions: [],
    records: [createRecord({ id: 'song-1' })],
    lockedSongs: [],
  } satisfies GoalsListData
  const draftGoal = {
    group_id: null,
    title: '虹枠の下書き',
    achievement_type: 'rainbow_count',
    achievement_params: { count: 1 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
  } satisfies GoalCreateRequest

  // When
  const result = resolveDraftGoalProgress(data, draftGoal)

  // Then
  assert.deepEqual(result, {
    current: 0,
    target: 1,
    percent: 0,
    achieved: false,
    targetCount: 0,
    hasUnknownMaxOp: false,
  })
})

test('同じ対象条件の目標が複数あっても、目標ごとの成果パラメータで進捗を計算する', () => {
  // Given: MASTERの2譜面とEXPERTの1譜面があり、同じ条件の目標2件と別条件の目標1件がある。
  /**
   * 進捗計算テスト用の目標を作る。
   *
   * @param id - 目標ID。並び順にも使う。
   * @param overrides - テストごとに差し替える目標項目。
   * @returns score_count を既定とした目標。
   */
  const createGoal = (id: number, overrides: Partial<GoalDTO>): GoalDTO => ({
    id,
    sort_order: id,
    created_at: '',
    group_id: null,
    title: `目標${id}`,
    achievement_type: 'score_count',
    achievement_params: { score: 1_000_000, count: 1 },
    attributes: { diff: ['MASTER'] },
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    ...overrides,
  })
  const data = {
    username: 'player',
    noPlayerData: false,
    goals: [
      createGoal(1, { achievement_params: { score: 1_000_000 } }),
      createGoal(2, { achievement_params: { score: 1_009_000 } }),
      createGoal(3, { attributes: { diff: ['EXPERT'] }, achievement_params: { score: 1_000_000 } }),
    ],
    groups: [],
    songs: [],
    masterData: {
      difficulties: [{ name: 'EXPERT' }, { name: 'MASTER' }],
      genres: [],
      versions: [],
      name_folders: [],
      account_types: [],
      rating_bands: [],
      achievement_types: [],
      possessions: [],
    },
    versions: [],
    records: [
      createRecord({ id: 'song-1', score: 1_010_000 }),
      createRecord({ id: 'song-2', score: 1_005_000 }),
      createRecord({ id: 'song-1', difficulty: 'EXPERT', score: 990_000 }),
    ],
    lockedSongs: [],
  } satisfies GoalsListData

  // When
  const result = buildGoalsWithProgress(data).map(({ goal, progress }) => [
    goal.id,
    progress.current,
    progress.target,
  ])

  // Then
  assert.deepEqual(result, [
    [1, 2, 2],
    [2, 1, 2],
    [3, 0, 1],
  ])
})
