import assert from 'node:assert/strict'
import test from 'node:test'
import { moveGoal } from './goalOrder'
import type { GoalWithProgress } from './goalsListProgress'

/**
 * テスト用の進捗付き目標を作る。
 *
 * @param id - 目標ID。
 * @returns 指定IDの進捗付き目標。
 */
const createGoalWithProgress = (id: number): GoalWithProgress => ({
  goal: {
    id,
    group_id: null,
    title: `目標${id}`,
    achievement_type: 'score_count',
    achievement_params: { score: 1_000_000, count: 1 },
    attributes: {},
    invert: false,
    sort_order: id,
    created_at: '2026-01-01T00:00:00Z',
  },
  progress: { current: 0, target: 1, percent: 0, achieved: false, hasUnknownMaxOp: false },
})

test('ドラッグした目標をドロップ先の位置へ移動する', () => {
  // Given
  const goals = [1, 2, 3].map(createGoalWithProgress)

  // When
  const result = moveGoal(goals, 1, 3)

  // Then
  assert.deepEqual(
    result.map(({ goal }) => goal.id),
    [2, 3, 1]
  )
  assert.deepEqual(
    goals.map(({ goal }) => goal.id),
    [1, 2, 3]
  )
})

test('存在しない目標IDでは順序を変更しない', () => {
  // Given
  const goals = [1, 2, 3].map(createGoalWithProgress)

  // When
  const result = moveGoal(goals, 1, 99)

  // Then
  assert.deepEqual(
    result.map(({ goal }) => goal.id),
    [1, 2, 3]
  )
})
