import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalCreateRequest, PlayerRecordDTO } from '../../../types/api'
import {
  resolveDraftGoalProgress,
  resolveGoalAllCount,
  shouldUseOpTargetSongAggregation,
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

test('OP対象かつOVER POWER系目標では曲単位集計を使う', () => {
  // Given / When / Then
  assert.equal(
    shouldUseOpTargetSongAggregation({
      achievement_type: 'overpower_value',
      attributes: { chart_target: 'OP_TARGET' },
    }),
    true
  )
  assert.equal(
    shouldUseOpTargetSongAggregation({
      achievement_type: 'rank_count',
      attributes: { chart_target: 'OP_TARGET' },
    }),
    false
  )
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
  } satisfies GoalCreateRequest

  // When
  const result = resolveDraftGoalProgress(undefined, draftGoal)

  // Then
  assert.deepEqual(result, {
    current: 0,
    target: 1,
    percent: 0,
    achieved: false,
    hasUnknownMaxOp: false,
  })
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
      account_types: [],
      rating_bands: [],
      achievement_types: [],
    },
    versions: [],
    records: [createRecord({ id: '15.8', const: 15.8 }), createRecord({ id: '15.9', const: 15.9 })],
  } satisfies GoalsListData

  // When
  const rating18Count = resolveGoalAllCount(data, {}, 'rating_count', { rating: 18 })
  const rating1795Count = resolveGoalAllCount(data, {}, 'rating_count', { rating: 17.95 })

  // Then
  assert.equal(rating18Count, 1)
  assert.equal(rating1795Count, 2)
})
