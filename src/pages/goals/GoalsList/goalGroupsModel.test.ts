import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalDTO, GoalGroupDTO } from '../../../types/api'
import {
  buildGoalGroupViews,
  moveDeletedGroupGoalsToUngrouped,
  moveGoalGroup,
  orderGoalsByPersistedGroupOrder,
  resolveCyclicGoalGroupId,
  resolveGoalFormGroupId,
  validateGoalGroupName,
} from './goalGroupsModel'
import type { GoalWithProgress } from './goalsListProgress'

/** テスト用目標グループを作る。 */
const createGroup = (id: number, sortOrder: number): GoalGroupDTO => ({
  id,
  name: `グループ${id}`,
  sort_order: sortOrder,
  created_at: '2026-01-01T00:00:00Z',
})

/** テスト用の進捗付き目標を作る。 */
const createGoal = (id: number, groupId: number | null, sortOrder: number): GoalWithProgress => ({
  goal: {
    id,
    group_id: groupId,
    title: `目標${id}`,
    achievement_type: 'score_count',
    achievement_params: { score: 1_000_000, count: 1 },
    attributes: {},
    invert: false,
    sort_order: sortOrder,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO,
  progress: { current: 0, target: 1, percent: 0, achieved: false, hasUnknownMaxOp: false },
})

test('グループ順に目標を分類し未分類を末尾へ追加する', () => {
  // Given
  const groups = [createGroup(10, 1), createGroup(20, 2)]
  const goals = orderGoalsByPersistedGroupOrder([
    createGoal(3, null, 1),
    createGoal(2, 10, 2),
    createGoal(1, 10, 1),
  ])

  // When
  const result = buildGoalGroupViews(groups, goals)

  // Then
  assert.deepEqual(
    result.map(({ groupId, goals: groupedGoals }) => ({
      groupId,
      goalIds: groupedGoals.map(({ goal }) => goal.id),
    })),
    [
      { groupId: 10, goalIds: [1, 2] },
      { groupId: 20, goalIds: [] },
      { groupId: null, goalIds: [3] },
    ]
  )
})

test('左右のグループ切替は未分類を含めて循環する', () => {
  // Given
  const views = buildGoalGroupViews([createGroup(10, 1), createGroup(20, 2)], [])

  // When / Then
  assert.equal(resolveCyclicGoalGroupId(views, 10, -1), null)
  assert.equal(resolveCyclicGoalGroupId(views, null, 1), 10)
})

test('未分類目標の編集では現在表示中グループへ置き換えない', () => {
  // Given
  const ungroupedGoal = createGoal(1, null, 1).goal

  // When / Then
  assert.equal(resolveGoalFormGroupId(ungroupedGoal, 10), null)
  assert.equal(resolveGoalFormGroupId(undefined, 10), 10)
})

test('グループをドロップ先へ移動する', () => {
  // Given
  const groups = [createGroup(10, 1), createGroup(20, 2), createGroup(30, 3)]

  // When
  const result = moveGoalGroup(groups, 10, 30)

  // Then
  assert.deepEqual(
    result.map(({ id }) => id),
    [20, 30, 10]
  )
  assert.equal(result[2], groups[0])
})

test('永続化済み順序への整列では目標object identityを維持する', () => {
  // Given
  const second = createGoal(2, 10, 2)
  const first = createGoal(1, 10, 1)

  // When
  const result = orderGoalsByPersistedGroupOrder([second, first])

  // Then
  assert.deepEqual(
    result.map(({ goal }) => goal.id),
    [1, 2]
  )
  assert.equal(result[0], first)
  assert.equal(result[1], second)
})

test('グループ名は空文字・制御文字・大文字小文字違いの重複を拒否する', () => {
  // Given
  const groups = [createGroup(10, 1)]

  // When / Then
  assert.equal(validateGoalGroupName('  ', groups), 'グループ名を入力してください。')
  assert.equal(validateGoalGroupName('攻略\n中', groups), 'グループ名に制御文字は使用できません。')
  groups[0].name = '失点'
  assert.equal(validateGoalGroupName('失点', groups), '同じ名前の目標グループがすでに存在します。')
  assert.equal(validateGoalGroupName('失点', groups, 10), '')
})

test('削除グループの目標を順序を保って未分類末尾へ移動する', () => {
  // Given
  const goals = [createGoal(1, null, 1), createGoal(2, 10, 1), createGoal(3, 10, 2)]

  // When
  const result = moveDeletedGroupGoalsToUngrouped(goals, 10)

  // Then
  assert.deepEqual(
    result.map(({ goal }) => ({ id: goal.id, groupId: goal.group_id, sortOrder: goal.sort_order })),
    [
      { id: 1, groupId: null, sortOrder: 1 },
      { id: 2, groupId: null, sortOrder: 2 },
      { id: 3, groupId: null, sortOrder: 3 },
    ]
  )
})
