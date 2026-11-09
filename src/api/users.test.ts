import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内状態をテストごとに分離してusers APIを読み込む。
 * @returns users APIモジュール。
 */
const loadUsersApi = () => loadTestModule((cacheKey) => import(`./users.ts?cache=${cacheKey}`))

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

test('fetchUserCourseRecordsは廃止済みクエリを付けずにコースレコード一覧を取得すること', async () => {
  // Given
  const calls = installFetchRecorder(() =>
    Response.json({
      courses: [],
      meta: { updated_at: null },
    })
  )
  const { fetchUserCourseRecords } = await loadUsersApi()

  // When
  await fetchUserCourseRecords('alice bob')

  // Then
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/users/alice%20bob/record/courses'
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

test('updateUserSuspiciousはURLエンコードしたユーザー名と不審フラグを送信すること', async () => {
  // Given
  const calls = installFetchRecorder(() => new Response(null, { status: 204 }))
  const { updateUserSuspicious } = await loadUsersApi()

  // When
  await updateUserSuspicious('alice bob', true)

  // Then
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/users/alice%20bob/suspicious'
  )
  assert.equal(calls[0]?.init?.method, 'PATCH')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.equal(calls[0]?.init?.body, JSON.stringify({ is_suspicious: true }))
})
