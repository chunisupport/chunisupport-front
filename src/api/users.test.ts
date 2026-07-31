import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * APIテスト用の環境変数を設定する。
 *
 * @returns なし。
 */
const setupApiTestEnv = (): void => {
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
 * モジュール内状態をテストごとに分離してusers APIを読み込む。
 *
 * @returns users APIモジュール。
 */
const loadUsersApi = async () => {
  setupApiTestEnv()
  const cacheKey = `${Date.now()}-${Math.random()}`
  return import(`./users.ts?cache=${cacheKey}`)
}

test('fetchUserUpdatedAtは同じユーザーへの同時呼び出しを1リクエストにまとめること', async () => {
  // Given
  const responseBody = { updated_at: '2026-07-06T00:00:00Z' }
  let fetchCount = 0
  globalThis.fetch = async (input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/users/alice/updated-at')
    fetchCount += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return Response.json(responseBody)
  }
  const { fetchUserUpdatedAt } = await loadUsersApi()

  // When
  const [first, second] = await Promise.all([
    fetchUserUpdatedAt('alice'),
    fetchUserUpdatedAt('alice'),
  ])

  // Then
  assert.equal(fetchCount, 1)
  assert.deepEqual(first, responseBody)
  assert.deepEqual(second, responseBody)
})

test('fetchUserUpdatedAtは完了後の呼び出しで最新更新日時を再取得すること', async () => {
  // Given
  let fetchCount = 0
  globalThis.fetch = async () => {
    fetchCount += 1
    return Response.json({ updated_at: `updated-${fetchCount}` })
  }
  const { fetchUserUpdatedAt } = await loadUsersApi()

  // When
  const first = await fetchUserUpdatedAt('alice')
  const second = await fetchUserUpdatedAt('alice')

  // Then
  assert.equal(fetchCount, 2)
  assert.equal(first.updated_at, 'updated-1')
  assert.equal(second.updated_at, 'updated-2')
})

test('fetchUserUpdatedAtは失敗した同時リクエストの完了後に再試行できること', async () => {
  // Given
  let fetchCount = 0
  globalThis.fetch = async () => {
    fetchCount += 1
    if (fetchCount === 1) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      throw new Error('network error')
    }
    return Response.json({ updated_at: '2026-07-06T00:00:00Z' })
  }
  const { fetchUserUpdatedAt } = await loadUsersApi()

  // When
  const failedRequests = await Promise.allSettled([
    fetchUserUpdatedAt('alice'),
    fetchUserUpdatedAt('alice'),
  ])
  const retried = await fetchUserUpdatedAt('alice')

  // Then
  assert.equal(fetchCount, 2)
  assert.ok(failedRequests.every((result) => result.status === 'rejected'))
  assert.equal(retried.updated_at, '2026-07-06T00:00:00Z')
})

test('fetchUserCourseRecordsは未プレイを含むコースレコード一覧を取得できること', async () => {
  // Given
  const responseBody = {
    courses: [
      {
        display_id: '0123456789abcdef',
        idx: '50020',
        name: 'CLASS I COURSE',
        class: '1',
        is_played: false,
        score: 0,
        is_clear: false,
        combo_lamp: null,
        updated_at: null,
      },
    ],
    meta: { updated_at: null },
  }
  globalThis.fetch = async (input) => {
    assert.equal(
      String(input),
      'http://localhost:3000/internal/users/alice%20bob/record/courses?include_noplay=true'
    )
    return Response.json(responseBody)
  }
  const { fetchUserCourseRecords } = await loadUsersApi()

  // When
  const response = await fetchUserCourseRecords('alice bob', { includeNoPlay: true })

  // Then
  assert.deepEqual(response, responseBody)
})

test('fetchAdminUserStatisticsは管理者向けユーザー集計を取得すること', async () => {
  // Given
  const responseBody = {
    total_users: 100,
    users_with_player_data: 80,
    active_player_data_last_30_days: 50,
  }
  globalThis.fetch = async (input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/admin/user-stats')
    return Response.json(responseBody)
  }
  const { fetchAdminUserStatistics } = await loadUsersApi()

  // When
  const response = await fetchAdminUserStatistics()

  // Then
  assert.deepEqual(response, responseBody)
})
