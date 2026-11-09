import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { appQueryClient } from '../lib/queryClient'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

beforeEach(() => appQueryClient.clear())
afterEach(() => appQueryClient.clear())

/**
 * テスト用環境を準備してユーザーqueryを読み込む。
 * @returns ユーザーqueryモジュール。
 */
const loadUsersApi = () => loadTestModule(() => import('./users.ts'))

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

test('更新日時はユーザーごとに異なるqueryとして同時取得する', async () => {
  // Given: ユーザーごとに値が異なるAPI。
  const calls = installFetchRecorder((input) => Response.json({ updated_at: String(input) }))
  const { fetchUserUpdatedAt, userQueryKeys } = await loadUsersApi()

  // When: 別ユーザーを同時に取得する。
  const [alice, bob] = await Promise.all([fetchUserUpdatedAt('alice'), fetchUserUpdatedAt('bob')])

  // Then: ユーザー間でリクエストとキャッシュを共有しない。
  assert.equal(calls.length, 2)
  assert.notEqual(alice.updated_at, bob.updated_at)
  assert.deepEqual(userQueryKeys.updatedAt('alice'), ['users', 'alice', 'updated-at'])
})
