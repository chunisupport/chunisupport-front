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

/** テスト用目標グループを作る */
const createGroup = (id: number, sortOrder: number): GoalGroupDTO => ({
  id,
  name: `グループ${id}`,
  sort_order: sortOrder,
  created_at: '2026-01-01T00:00:00Z',
})

/** テスト用の進捗付き目標を作る */
const createGoal = (id: number, groupId: number | null, sortOrder: number): GoalWithProgress => ({
  goal: {
    id,
    group_id: groupId,
    title: `目標${id}`,
    achievement_type: 'score_count',
    achievement_params: { score: 1_000_000, count: 1 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: sortOrder,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO,
  progress: {
    current: 0,
    target: 1,
    percent: 0,
    achieved: false,
    targetCount: 0,
    hasUnknownMaxOp: false,
  },
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

test('グループ名が空白だけの場合は入力を求める', () => {
  // Given
  const groups = [createGroup(10, 1)]

  // When
  const result = validateGoalGroupName('  ', groups)

  // Then
  assert.equal(result, 'グループ名を入力してください。')
})

test('グループ名に制御文字を含む場合は拒否する', () => {
  // Given
  const groups = [createGroup(10, 1)]

  // When
  const result = validateGoalGroupName('攻略\n中', groups)

  // Then
  assert.equal(result, 'グループ名に制御文字は使用できません。')
})

test('グループ名が既存グループと同じ文字列の場合は重複として拒否する', () => {
  // Given
  const groups = [{ ...createGroup(10, 1), name: '失点' }]

  // When
  const result = validateGoalGroupName('失点', groups)

  // Then
  assert.equal(result, '同じ名前の目標グループがすでに存在します。')
})

test('グループ名は大文字小文字だけが異なる既存名を重複として拒否する', () => {
  // Given
  const groups = [{ ...createGroup(10, 1), name: 'Attack' }]

  // When
  const result = validateGoalGroupName('aTTACK', groups)

  // Then
  assert.equal(result, '同じ名前の目標グループがすでに存在します。')
})

test('改名中のグループ自身の名前は重複として扱わない', () => {
  // Given
  const groups = [{ ...createGroup(10, 1), name: 'Attack' }]

  // When
  const result = validateGoalGroupName('aTTACK', groups, 10)

  // Then
  assert.equal(result, '')
})

test('日本語名が既存グループ自身と同一でも改名を許可する', () => {
  // Given
  const groups = [{ ...createGroup(10, 1), name: '失点' }]

  // When
  const result = validateGoalGroupName('失点', groups, 10)

  // Then
  assert.equal(result, '')
})

test('未分類の順序1を維持して整列済みの削除目標を順序2・3へ移動する', () => {
  // Given: 未分類の末尾は順序1で、移動元は順序1・2に整列している。
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

test('削除グループの目標を元の順序で未分類の最大順序の後ろへ移動する', () => {
  // Given: 削除グループの目標は順序2・1の逆順で並び、未分類には順序10の目標が1件ある
  const unrelatedGoal = createGoal(4, 20, 1)
  const goals = [createGoal(1, null, 10), createGoal(3, 10, 2), createGoal(2, 10, 1), unrelatedGoal]

  // When
  const result = moveDeletedGroupGoalsToUngrouped(goals, 10)

  // Then: 順序1の目標が11、順序2の目標が12になり、無関係なグループの目標は変わらない
  assert.deepEqual(
    result.map(({ goal }) => ({ id: goal.id, groupId: goal.group_id, sortOrder: goal.sort_order })),
    [
      { id: 1, groupId: null, sortOrder: 10 },
      { id: 3, groupId: null, sortOrder: 12 },
      { id: 2, groupId: null, sortOrder: 11 },
      { id: 4, groupId: 20, sortOrder: 1 },
    ]
  )
  assert.equal(result[3], unrelatedGoal)
})

test('未分類の目標がない場合は削除グループの目標を順序1から並べる', () => {
  // Given
  const goals = [createGoal(2, 10, 5), createGoal(1, 10, 3)]

  // When
  const result = moveDeletedGroupGoalsToUngrouped(goals, 10)

  // Then
  assert.deepEqual(
    result.map(({ goal }) => ({ id: goal.id, groupId: goal.group_id, sortOrder: goal.sort_order })),
    [
      { id: 2, groupId: null, sortOrder: 2 },
      { id: 1, groupId: null, sortOrder: 1 },
    ]
  )
})

test('存在しないグループからの移動では順序を変えない', () => {
  // Given
  const groups = [createGroup(10, 1), createGroup(20, 2), createGroup(30, 3)]

  // When
  const result = moveGoalGroup(groups, 999, 20)

  // Then
  assert.deepEqual(
    result.map(({ id }) => id),
    [10, 20, 30]
  )
})

test('存在しないグループへの移動では順序を変えない', () => {
  // Given
  const groups = [createGroup(10, 1), createGroup(20, 2), createGroup(30, 3)]

  // When
  const result = moveGoalGroup(groups, 10, 999)

  // Then
  assert.deepEqual(
    result.map(({ id }) => id),
    [10, 20, 30]
  )
})

test('先頭グループへの移動では先頭へ挿入する', () => {
  // Given
  const groups = [createGroup(10, 1), createGroup(20, 2), createGroup(30, 3)]

  // When
  const result = moveGoalGroup(groups, 30, 10)

  // Then
  assert.deepEqual(
    result.map(({ id }) => id),
    [30, 10, 20]
  )
})

test('グループ名が30文字ちょうどの場合は受け入れる', () => {
  // Given
  const groups = [createGroup(10, 1)]

  // When
  const result = validateGoalGroupName('abcdefghijabcdefghijabcdefghij', groups)

  // Then
  assert.equal(result, '')
})
