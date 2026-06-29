import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalCreateRequest } from '../../../types/api'
import { resolveDraftGoalProgress, shouldUseOpTargetSongAggregation } from './goalsListProgress'

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
    title: '下書き',
    achievement_type: 'score_count',
    achievement_params: { score: 1000000, count: 1 },
    attributes: {},
    invert: false,
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
