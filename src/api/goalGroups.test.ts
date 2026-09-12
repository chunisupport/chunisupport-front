import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * 目標・目標グループAPIモジュールをテスト用に読み込む。
 * @returns キャッシュを分離して読み込んだAPIモジュール。
 */
const loadGoalApi = () =>
  loadTestModule(
    async (cacheKey) => {
      const [goalGroupsApi, goalsApi] = await Promise.all([
        import(`./goalGroups.ts?cache=${cacheKey}`),
        import(`./goals.ts?cache=${cacheKey}`),
      ])
      return { goalGroupsApi, goalsApi }
    },
    { authenticate: true }
  )

test('目標グループCRUDと並び替えAPIは仕様どおりのパスと本文を使う', async () => {
  // Given
  const calls = installFetchRecorder((input, init) => {
    if (init?.method === 'DELETE' || String(input).endsWith('/order')) {
      return new Response(null, { status: 204 })
    }
    if (init?.method === 'GET') return Response.json({ groups: [] })
    return Response.json({ id: 1, name: '失点', sort_order: 1, created_at: '' })
  })
  const { goalGroupsApi } = await loadGoalApi()

  // When
  await goalGroupsApi.fetchGoalGroups()
  await goalGroupsApi.createGoalGroup({ name: '失点' })
  await goalGroupsApi.updateGoalGroup(1, { name: 'AJ' })
  await goalGroupsApi.deleteGoalGroup(1)
  await goalGroupsApi.reorderGoalGroups([2, 1])

  // Then
  assert.deepEqual(
    calls.map((call) => ({
      url: String(call.input),
      method: call.init?.method,
      body: call.init?.body,
    })),
    [
      { url: 'http://localhost:3000/internal/me/goal-groups', method: 'GET', body: undefined },
      {
        url: 'http://localhost:3000/internal/me/goal-groups',
        method: 'POST',
        body: JSON.stringify({ name: '失点' }),
      },
      {
        url: 'http://localhost:3000/internal/me/goal-groups/1',
        method: 'PUT',
        body: JSON.stringify({ name: 'AJ' }),
      },
      {
        url: 'http://localhost:3000/internal/me/goal-groups/1',
        method: 'DELETE',
        body: undefined,
      },
      {
        url: 'http://localhost:3000/internal/me/goal-groups/order',
        method: 'PUT',
        body: JSON.stringify({ group_ids: [2, 1] }),
      },
    ]
  )
})

test('目標並び替えAPIは対象グループとそのグループの全目標IDを送る', async () => {
  // Given
  const calls = installFetchRecorder(() => new Response(null, { status: 204 }))
  const { goalsApi } = await loadGoalApi()

  // When
  await goalsApi.reorderGoals(3, [12, 5, 9])
  await goalsApi.reorderGoals(null, [8, 4])

  // Then
  assert.deepEqual(
    calls.map((call) => ({
      url: String(call.input),
      method: call.init?.method,
      body: call.init?.body,
    })),
    [
      {
        url: 'http://localhost:3000/internal/me/goals/order',
        method: 'PUT',
        body: JSON.stringify({ group_id: 3, goal_ids: [12, 5, 9] }),
      },
      {
        url: 'http://localhost:3000/internal/me/goals/order',
        method: 'PUT',
        body: JSON.stringify({ group_id: null, goal_ids: [8, 4] }),
      },
    ]
  )
})
