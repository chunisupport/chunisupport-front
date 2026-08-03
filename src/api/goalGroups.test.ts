import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * 目標グループAPIテスト用の環境変数を設定する。
 *
 * @returns なし。
 */
const setupGoalGroupsApiTestEnv = (): void => {
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_FRONTEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_DOCUMENTATION_URL = 'https://docs.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_URL = 'https://dist.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_ENTRYPOINT = 'main.js'
  process.env.PUBLIC_FB_API_KEY = 'test-api-key'
  process.env.PUBLIC_FB_AUTH_DOMAIN = 'test.firebaseapp.com'
  process.env.PUBLIC_FB_PROJECT_ID = 'test-project'
  process.env.PUBLIC_FB_STORAGE_BUCKET = 'test.appspot.com'
  process.env.PUBLIC_FB_MESSAGING_SENDER_ID = '123456789'
  process.env.PUBLIC_FB_APP_ID = 'test-app-id'
  process.env.PUBLIC_CF_TURNSTILE_SITE_KEY = '1x00000000000000000000AA'
}

/**
 * Firebase認証状態をテスト用ログイン済みに差し替える。
 *
 * @returns 差し替え完了後に解決されるPromise。
 */
const setupAuthenticatedFirebase = async (): Promise<void> => {
  const { auth } = await import('../lib/firebase.ts')
  Object.defineProperty(auth, 'authStateReady', {
    configurable: true,
    value: async () => undefined,
  })
  Object.defineProperty(auth, 'currentUser', {
    configurable: true,
    value: { getIdToken: async () => 'test-token' },
  })
}

/**
 * 目標・目標グループAPIモジュールをテスト用に読み込む。
 *
 * @returns キャッシュを分離して読み込んだAPIモジュール。
 */
const loadGoalApi = async () => {
  setupGoalGroupsApiTestEnv()
  await setupAuthenticatedFirebase()
  const cacheKey = `${Date.now()}-${Math.random()}`
  const [goalGroupsApi, goalsApi] = await Promise.all([
    import(`./goalGroups.ts?cache=${cacheKey}`),
    import(`./goals.ts?cache=${cacheKey}`),
  ])
  return { goalGroupsApi, goalsApi }
}

test('目標グループCRUDと並び替えAPIは仕様どおりのパスと本文を使う', async () => {
  // Given
  const requests: Array<{ url: string; method?: string; body?: BodyInit | null }> = []
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), method: init?.method, body: init?.body })
    if (init?.method === 'DELETE' || String(input).endsWith('/order')) {
      return new Response(null, { status: 204 })
    }
    if (init?.method === 'GET') return Response.json({ groups: [] })
    return Response.json({ id: 1, name: '失点', sort_order: 1, created_at: '' })
  }
  const { goalGroupsApi } = await loadGoalApi()

  // When
  await goalGroupsApi.fetchGoalGroups()
  await goalGroupsApi.createGoalGroup({ name: '失点' })
  await goalGroupsApi.updateGoalGroup(1, { name: 'AJ' })
  await goalGroupsApi.deleteGoalGroup(1)
  await goalGroupsApi.reorderGoalGroups([2, 1])

  // Then
  assert.deepEqual(requests, [
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
  ])
})

test('目標並び替えAPIは対象グループとそのグループの全目標IDを送る', async () => {
  // Given
  const requests: Array<{ url: string; method?: string; body?: BodyInit | null }> = []
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), method: init?.method, body: init?.body })
    return new Response(null, { status: 204 })
  }
  const { goalsApi } = await loadGoalApi()

  // When
  await goalsApi.reorderGoals(3, [12, 5, 9])
  await goalsApi.reorderGoals(null, [8, 4])

  // Then
  assert.deepEqual(requests, [
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
  ])
})
