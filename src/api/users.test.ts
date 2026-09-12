import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内状態をテストごとに分離してusers APIを読み込む。
 * @returns users APIモジュール。
 */
const loadUsersApi = () => loadTestModule((cacheKey) => import(`./users.ts?cache=${cacheKey}`))

test('fetchUserUpdatedAtは同じユーザーへの同時呼び出しを1リクエストにまとめること', async () => {
  // Given
  const responseBody = { updated_at: '2026-07-06T00:00:00Z' }
  let fetchCount = 0
  installFetchRecorder(async (input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/users/alice/updated-at')
    fetchCount += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return Response.json(responseBody)
  })
  const { fetchUserUpdatedAt } = await loadUsersApi()

  // When
  const [first, second] = await Promise.all([
    fetchUserUpdatedAt('alice'),
    fetchUserUpdatedAt('alice'),
  ])

  // Then
  assert.equal(fetchCount, 1)
  assert.equal(first, second)
})

test('fetchUserUpdatedAtは完了後の呼び出しで最新更新日時を再取得すること', async () => {
  // Given
  let fetchCount = 0
  installFetchRecorder(async () => {
    fetchCount += 1
    return Response.json({ updated_at: `updated-${fetchCount}` })
  })
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
  installFetchRecorder(async () => {
    fetchCount += 1
    if (fetchCount === 1) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      throw new Error('network error')
    }
    return Response.json({ updated_at: '2026-07-06T00:00:00Z' })
  })
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

test('fetchUserRatingOpHistoryはURLエンコードしたユーザー名の公式指標履歴を取得すること', async () => {
  // Given
  const calls = installFetchRecorder(() =>
    Response.json({
      entries: [
        {
          rating: 17.25,
          overpower: 12345.67,
          data_collected_at: '2026-08-08T12:00:00Z',
        },
      ],
    })
  )
  const { fetchUserRatingOpHistory } = await loadUsersApi()

  // When
  await fetchUserRatingOpHistory('alice bob')

  // Then
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/users/alice%20bob/rating-op-history'
  )
})

test('fetchUserCourseRecordsは未プレイを含むコースレコード一覧を取得できること', async () => {
  // Given
  const calls = installFetchRecorder(() =>
    Response.json({
      courses: [],
      meta: { updated_at: null },
    })
  )
  const { fetchUserCourseRecords } = await loadUsersApi()

  // When
  await fetchUserCourseRecords('alice bob', { includeNoPlay: true })

  // Then
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/users/alice%20bob/record/courses?include_noplay=true'
  )
})

test('fetchAdminUsersはpageとnameをクエリに付けて一覧を取得すること', async () => {
  // Given
  const calls = installFetchRecorder(() => Response.json([]))
  const { fetchAdminUsers } = await loadUsersApi()

  // When
  await fetchAdminUsers({ page: 2, name: 'user' })

  // Then
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/users/?page=2&name=user')
})

test('fetchAdminUsersはpage未指定なら1ページ目を取得すること', async () => {
  // Given
  const calls = installFetchRecorder(() => Response.json([]))
  const { fetchAdminUsers } = await loadUsersApi()

  // When
  await fetchAdminUsers()

  // Then
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/users/?page=1')
})

test('fetchAdminUserStatisticsは管理者向けユーザー集計を取得すること', async () => {
  // Given
  const calls = installFetchRecorder(() =>
    Response.json({
      total_users: 100,
      users_with_player_data: 80,
      active_player_data_last_30_days: 50,
    })
  )
  const { fetchAdminUserStatistics } = await loadUsersApi()

  // When
  await fetchAdminUserStatistics()

  // Then
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/admin/user-stats')
})

test('fetchAdminUserPermissionsは権限候補を取得すること', async () => {
  // Given
  const calls = installFetchRecorder(() =>
    Response.json({ permissions: ['PLAYER', 'EDITOR', 'ADMIN', 'EXTDEV'] })
  )
  const { fetchAdminUserPermissions } = await loadUsersApi()

  // When
  await fetchAdminUserPermissions()

  // Then
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/master/permissions')
})

test('updateUserPermissionはURLエンコードしたユーザー名と選択した権限を送信すること', async () => {
  // Given
  const calls = installFetchRecorder(() => new Response(null, { status: 204 }))
  const { updateUserPermission } = await loadUsersApi()

  // When
  await updateUserPermission('alice bob', 'EDITOR')

  // Then
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/users/alice%20bob/permission'
  )
  assert.equal(calls[0]?.init?.method, 'PATCH')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.equal(calls[0]?.init?.body, JSON.stringify({ permission: 'EDITOR' }))
})
