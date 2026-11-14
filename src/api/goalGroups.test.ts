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

test('目標グループの一覧取得APIは仕様どおりのパスと本文を使う', async () => {
  // Given: 成功する一覧取得API。
  const calls = installFetchRecorder(() => Response.json({ groups: [] }))
  const { goalGroupsApi } = await loadGoalApi()

  // When: 一覧取得を実行する。
  await goalGroupsApi.fetchGoalGroups()

  // Then: 対象URLに指定したメソッドと本文を送る。
  assert.deepEqual(
    calls.map((call) => ({
      url: String(call.input),
      method: call.init?.method,
      body: call.init?.body,
    })),
    [
      {
        url: 'http://localhost:3000/internal/me/goal-groups',
        method: 'GET',
        body: undefined,
      },
    ]
  )
})

test('目標グループの作成APIは仕様どおりのパスと本文を使う', async () => {
  // Given: 成功する作成API。
  const calls = installFetchRecorder(() =>
    Response.json({ id: 1, name: '失点', sort_order: 1, created_at: '' })
  )
  const { goalGroupsApi } = await loadGoalApi()

  // When: 作成を実行する。
  await goalGroupsApi.createGoalGroup({ name: '失点' })

  // Then: 対象URLに指定したメソッドと本文を送る。
  assert.deepEqual(
    calls.map((call) => ({
      url: String(call.input),
      method: call.init?.method,
      body: call.init?.body,
    })),
    [
      {
        url: 'http://localhost:3000/internal/me/goal-groups',
        method: 'POST',
        body: '{"name":"失点"}',
      },
    ]
  )
})

test('目標グループの更新APIは仕様どおりのパスと本文を使う', async () => {
  // Given: 成功する更新API。
  const calls = installFetchRecorder(() =>
    Response.json({ id: 1, name: 'AJ', sort_order: 1, created_at: '' })
  )
  const { goalGroupsApi } = await loadGoalApi()

  // When: 更新を実行する。
  await goalGroupsApi.updateGoalGroup(1, { name: 'AJ' })

  // Then: 対象URLに指定したメソッドと本文を送る。
  assert.deepEqual(
    calls.map((call) => ({
      url: String(call.input),
      method: call.init?.method,
      body: call.init?.body,
    })),
    [
      {
        url: 'http://localhost:3000/internal/me/goal-groups/1',
        method: 'PUT',
        body: '{"name":"AJ"}',
      },
    ]
  )
})

test('目標グループの削除APIは仕様どおりのパスと本文を使う', async () => {
  // Given: 成功する削除API。
  const calls = installFetchRecorder(() => new Response(null, { status: 204 }))
  const { goalGroupsApi } = await loadGoalApi()

  // When: 削除を実行する。
  await goalGroupsApi.deleteGoalGroup(1)

  // Then: 対象URLに指定したメソッドと本文を送る。
  assert.deepEqual(
    calls.map((call) => ({
      url: String(call.input),
      method: call.init?.method,
      body: call.init?.body,
    })),
    [
      {
        url: 'http://localhost:3000/internal/me/goal-groups/1',
        method: 'DELETE',
        body: undefined,
      },
    ]
  )
})

test('目標グループの並び替えAPIは仕様どおりのパスと本文を使う', async () => {
  // Given: 成功する並び替えAPI。
  const calls = installFetchRecorder(() => new Response(null, { status: 204 }))
  const { goalGroupsApi } = await loadGoalApi()

  // When: 並び替えを実行する。
  await goalGroupsApi.reorderGoalGroups([2, 1])

  // Then: 対象URLに指定したメソッドと本文を送る。
  assert.deepEqual(
    calls.map((call) => ({
      url: String(call.input),
      method: call.init?.method,
      body: call.init?.body,
    })),
    [
      {
        url: 'http://localhost:3000/internal/me/goal-groups/order',
        method: 'PUT',
        body: '{"group_ids":[2,1]}',
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
