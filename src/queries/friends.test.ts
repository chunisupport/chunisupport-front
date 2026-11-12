import assert from 'node:assert/strict'
import test from 'node:test'
import { QueryClient } from '@tanstack/solid-query'
import { loadTestModule } from '../test/setupTestEnvironment'

/**
 * フレンドquery moduleを環境設定後に読み込む。
 * @returns フレンドquery module。
 */
const loadFriendsQuery = () => loadTestModule(() => import('./friends.ts'))

/**
 * query単体テスト用のQueryClientを生成する。
 * @returns 自動再試行と自動破棄を無効化したQueryClient。
 */
const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Number.POSITIVE_INFINITY,
      },
    },
  })

test('フレンド一覧query keyは認証ユーザーと一覧種別で分離される', async () => {
  // Given: 2ユーザーと3種類の一覧。
  const { friendshipQueryKeys } = await loadFriendsQuery()

  // When: query keyを生成する。
  const aliceFriends = friendshipQueryKeys.friends('alice')
  const aliceReceived = friendshipQueryKeys.received('alice')
  const aliceSent = friendshipQueryKeys.sent('alice')
  const bobFriends = friendshipQueryKeys.friends('bob')

  // Then: ユーザーまたは一覧種別が異なればkeyも異なる。
  assert.notDeepEqual(aliceFriends, aliceReceived)
  assert.notDeepEqual(aliceReceived, aliceSent)
  assert.notDeepEqual(aliceFriends, bobFriends)
})

test('フレンド申請は必要なqueryだけを正確な一致範囲で無効化対象にする', async () => {
  // Given: aliceのフレンド申請操作。
  const { getFriendMutationInvalidationFilters } = await loadFriendsQuery()

  // When: 無効化filter全体を取得する。
  const filters = getFriendMutationInvalidationFilters('alice', 'request')

  // Then: 一覧は完全一致、ランキング・比較は子queryも対象にする。
  assert.deepEqual(filters, [
    { queryKey: ['friendships', 'alice', 'friends'], exact: true },
    { queryKey: ['friendships', 'alice', 'requests', 'received'], exact: true },
    { queryKey: ['friendships', 'alice', 'requests', 'sent'], exact: true },
    { queryKey: ['friendships', 'alice', 'slots'], exact: true },
    { queryKey: ['friend-rankings', 'alice'] },
  ])
})

test('フレンド承認は必要なqueryだけを正確な一致範囲で無効化対象にする', async () => {
  // Given: aliceのフレンド承認操作。
  const { getFriendMutationInvalidationFilters } = await loadFriendsQuery()

  // When: 無効化filter全体を取得する。
  const filters = getFriendMutationInvalidationFilters('alice', 'accept')

  // Then: 一覧は完全一致、ランキング・比較は子queryも対象にする。
  assert.deepEqual(filters, [
    { queryKey: ['friendships', 'alice', 'requests', 'received'], exact: true },
    { queryKey: ['friendships', 'alice', 'friends'], exact: true },
    { queryKey: ['friendships', 'alice', 'slots'], exact: true },
    { queryKey: ['friend-rankings', 'alice'] },
    { queryKey: ['friend-comparisons', 'alice'] },
  ])
})

test('フレンド拒否は必要なqueryだけを正確な一致範囲で無効化対象にする', async () => {
  // Given: aliceのフレンド拒否操作。
  const { getFriendMutationInvalidationFilters } = await loadFriendsQuery()

  // When: 無効化filter全体を取得する。
  const filters = getFriendMutationInvalidationFilters('alice', 'reject')

  // Then: 一覧は完全一致、ランキング・比較は子queryも対象にする。
  assert.deepEqual(filters, [
    { queryKey: ['friendships', 'alice', 'requests', 'received'], exact: true },
  ])
})

test('フレンド取消は必要なqueryだけを正確な一致範囲で無効化対象にする', async () => {
  // Given: aliceのフレンド取消操作。
  const { getFriendMutationInvalidationFilters } = await loadFriendsQuery()

  // When: 無効化filter全体を取得する。
  const filters = getFriendMutationInvalidationFilters('alice', 'cancel')

  // Then: 一覧は完全一致、ランキング・比較は子queryも対象にする。
  assert.deepEqual(filters, [
    { queryKey: ['friendships', 'alice', 'requests', 'sent'], exact: true },
    { queryKey: ['friendships', 'alice', 'slots'], exact: true },
  ])
})

test('フレンド解除は必要なqueryだけを正確な一致範囲で無効化対象にする', async () => {
  // Given: aliceのフレンド解除操作。
  const { getFriendMutationInvalidationFilters } = await loadFriendsQuery()

  // When: 無効化filter全体を取得する。
  const filters = getFriendMutationInvalidationFilters('alice', 'remove')

  // Then: 一覧は完全一致、ランキング・比較は子queryも対象にする。
  assert.deepEqual(filters, [
    { queryKey: ['friendships', 'alice', 'friends'], exact: true },
    { queryKey: ['friendships', 'alice', 'slots'], exact: true },
    { queryKey: ['friend-rankings', 'alice'] },
    { queryKey: ['friend-comparisons', 'alice'] },
  ])
})

test('mutation無効化は別ユーザーのキャッシュへ影響しない', async () => {
  // Given: aliceとbobのフレンド一覧キャッシュ。
  const { friendshipQueryKeys, invalidateFriendQueriesAfterMutation } = await loadFriendsQuery()
  const queryClient = createTestQueryClient()
  const aliceKey = friendshipQueryKeys.friends('alice')
  const bobKey = friendshipQueryKeys.friends('bob')
  queryClient.setQueryData(aliceKey, [])
  queryClient.setQueryData(bobKey, [])

  // When: aliceの解除操作を反映する。
  await invalidateFriendQueriesAfterMutation(queryClient, 'alice', 'remove')

  // Then: aliceだけがstaleになる。
  assert.equal(queryClient.getQueryState(aliceKey)?.isInvalidated, true)
  assert.equal(queryClient.getQueryState(bobKey)?.isInvalidated, false)
  queryClient.clear()
})

test('認証ユーザー変更時は旧ユーザーのフレンド関連キャッシュを削除する', async () => {
  // Given: aliceとbobのフレンド関連キャッシュ。
  const { clearFriendQueriesForUser, friendshipQueryKeys } = await loadFriendsQuery()
  const queryClient = createTestQueryClient()
  const aliceFriendsKey = friendshipQueryKeys.friends('alice')
  const aliceRankingKey = ['friend-rankings', 'alice', 'song', 'song-1', 'MASTER'] as const
  const aliceComparisonKey = ['friend-comparisons', 'alice', 'frienduser', 'MASTER'] as const
  const bobFriendsKey = friendshipQueryKeys.friends('bob')
  queryClient.setQueryData(aliceFriendsKey, [])
  queryClient.setQueryData(aliceRankingKey, { ranking: [] })
  queryClient.setQueryData(aliceComparisonKey, { items: [] })
  queryClient.setQueryData(bobFriendsKey, [])

  // When: aliceの認証依存queryを破棄する。
  await clearFriendQueriesForUser(queryClient, 'alice')

  // Then: aliceだけが削除される。
  assert.equal(queryClient.getQueryState(aliceFriendsKey), undefined)
  assert.equal(queryClient.getQueryState(aliceRankingKey), undefined)
  assert.equal(queryClient.getQueryState(aliceComparisonKey), undefined)
  assert.notEqual(queryClient.getQueryState(bobFriendsKey), undefined)
  queryClient.clear()
})
