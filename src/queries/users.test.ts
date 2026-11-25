import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { onlineManager } from '@tanstack/solid-query'
import { appQueryClient } from '../lib/queryClient'
import { clearAuthenticatedUser, resetAuthSession } from '../stores/authSession'
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
  const responseBody = { updated_at: '2026-07-06T00:00:00Z', stats_revision: 1 }
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
  assert.deepEqual(first, responseBody)
})

test('fetchUserUpdatedAtは完了後の呼び出しで最新更新日時を再取得すること', async () => {
  // Given
  let fetchCount = 0
  installFetchRecorder(async () => {
    fetchCount += 1
    return Response.json({ updated_at: `updated-${fetchCount}`, stats_revision: fetchCount })
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
    return Response.json({ updated_at: '2026-07-06T00:00:00Z', stats_revision: 1 })
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
  const calls = installFetchRecorder((input) =>
    Response.json({ updated_at: String(input), stats_revision: 1 })
  )
  const { fetchUserUpdatedAt, userQueryKeys } = await loadUsersApi()

  // When: 別ユーザーを同時に取得する。
  const [alice, bob] = await Promise.all([fetchUserUpdatedAt('alice'), fetchUserUpdatedAt('bob')])

  // Then: ユーザー間でリクエストとキャッシュを共有しない。
  assert.equal(calls.length, 2)
  assert.notEqual(alice.updated_at, bob.updated_at)
  assert.deepEqual(userQueryKeys.updatedAt('alice'), ['users', 'alice', 'updated-at'])
})

test('fetchUserUpdatedAtはstats_revisionが欠損または不正なレスポンスをエラーにすること', async () => {
  // Given: 旧API相当で stats_revision を含まないレスポンス。
  installFetchRecorder(() => Response.json({ updated_at: '2026-07-06T00:00:00Z' }))
  const { fetchUserUpdatedAt } = await loadUsersApi()

  // When & Then: キャッシュ判定へ undefined を通さず TypeError で拒否する。
  await assert.rejects(() => fetchUserUpdatedAt('alice'), TypeError)
})

test('全楽曲レコードは同じユーザーのqueryで再利用し、破棄後は取得し直す', async (t) => {
  // Given: IndexedDBを介さず、呼び出すたびに更新日時が変わるレコードAPI。
  clearAuthenticatedUser()
  t.after(resetAuthSession)
  let fetchCount = 0
  installFetchRecorder((input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/users/alice/record')
    fetchCount += 1
    return Response.json({ meta: { updated_at: `updated-${fetchCount}` }, standard: [] })
  })
  const { removeUserRecordQuery, userRecordQueryOptions } = await loadUsersApi()

  // When: 同じユーザーのレコードを再度要求し、スコア登録後と同様に破棄する。
  const first = await appQueryClient.fetchQuery(userRecordQueryOptions('alice'))
  const reused = await appQueryClient.fetchQuery(userRecordQueryOptions('alice'))
  removeUserRecordQuery(appQueryClient, 'alice')
  const refreshed = await appQueryClient.fetchQuery(userRecordQueryOptions('alice'))

  // Then: 破棄前はキャッシュを共有し、破棄後に新しいデータを取得する。
  assert.equal(fetchCount, 2)
  assert.equal(first, reused)
  assert.equal(refreshed.meta.updated_at, 'updated-2')
})

test('取得中に全楽曲レコードを破棄すると、旧応答を使わず取り直した値を返す', async (t) => {
  // Given: 1回目の応答だけ手動で完了させるレコードAPI。
  clearAuthenticatedUser()
  t.after(resetAuthSession)
  let fetchCount = 0
  let releaseFirst: () => void = () => undefined
  installFetchRecorder(async () => {
    fetchCount += 1
    const updatedAt = `updated-${fetchCount}`
    if (fetchCount === 1) await new Promise<void>((resolve) => (releaseFirst = resolve))
    return Response.json({ meta: { updated_at: updatedAt }, standard: [] })
  })
  const { removeUserRecordQuery, userRecordQueryOptions } = await loadUsersApi()
  const { fetchQueryWithRestartOnRemoval } = await loadTestModule(
    () => import('./fetchQueryWithRestartOnRemoval.ts')
  )

  // When: プロフィールと同じ方法で取得中にqueryを破棄し、その後に旧応答を完了させる。
  const pending = fetchQueryWithRestartOnRemoval(userRecordQueryOptions('alice'))
  await new Promise((resolve) => setTimeout(resolve, 0))
  removeUserRecordQuery(appQueryClient, 'alice')
  releaseFirst()
  const result = await pending
  const cached = await appQueryClient.fetchQuery(userRecordQueryOptions('alice'))

  // Then: 待機中の呼び出し元もキャッシュも、破棄後に取り直した応答になる。
  assert.equal(fetchCount, 2)
  assert.equal(result.meta.updated_at, 'updated-2')
  assert.equal(cached, result)
})

test('プロフィールコメントqueryは enabled が false のとき取得しない設定になること', async () => {
  // Given: コメント機能を無効にした query options。
  const { userCommentQueryOptions, userQueryKeys } = await loadUsersApi()

  // When: 対象ユーザーのコメント query を作る。
  const options = userCommentQueryOptions('alice', false)

  // Then: 取得は無効で、キャッシュキーはユーザーのコメントを指す。
  assert.equal(options.enabled, false)
  assert.deepEqual(options.queryKey, userQueryKeys.comment('alice'))
})

test('プロフィールコメントqueryは enabled が true のとき取得する設定になること', async () => {
  // Given: コメント機能を有効にした query options。
  const { userCommentQueryOptions } = await loadUsersApi()

  // When: 対象ユーザーのコメント query を作る。
  const options = userCommentQueryOptions('alice', true)

  // Then: 取得は有効。
  assert.equal(options.enabled, true)
})

test('fetchUserUpdatedAtはオフライン時も一時停止せず、通信失敗を呼び出し元へ返すこと', async (t) => {
  // Given: ブラウザーがオフラインで、通信が失敗する。
  onlineManager.setOnline(false)
  t.after(() => onlineManager.setOnline(true))
  installFetchRecorder(() => {
    throw new Error('network error')
  })
  const { fetchUserUpdatedAt } = await loadUsersApi()

  // When & Then: 再接続を待たずに通信失敗としてrejectされる。
  await assert.rejects(() => fetchUserUpdatedAt('alice'), /network error/)
})
