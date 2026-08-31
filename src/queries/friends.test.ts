import assert from 'node:assert/strict'
import test from 'node:test'
import { QueryClient } from '@tanstack/solid-query'

/**
 * query moduleの読み込みに必要な環境変数を設定する。
 *
 * @returns なし。
 */
const setupQueryTestEnv = (): void => {
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
 * フレンドquery moduleを環境設定後に読み込む。
 *
 * @returns フレンドquery module。
 */
const loadFriendsQuery = async () => {
  setupQueryTestEnv()
  return import('./friends.ts')
}

/**
 * query単体テスト用のQueryClientを生成する。
 *
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

test('フレンド操作ごとに必要なqueryだけを無効化対象にする', async () => {
  // Given: 各フレンド操作。
  const { getFriendMutationInvalidationFilters } = await loadFriendsQuery()

  // When: query key一覧へ変換する。
  const requestKeys = getFriendMutationInvalidationFilters('alice', 'request').map(
    (filter) => filter.queryKey
  )
  const acceptKeys = getFriendMutationInvalidationFilters('alice', 'accept').map(
    (filter) => filter.queryKey
  )
  const rejectKeys = getFriendMutationInvalidationFilters('alice', 'reject').map(
    (filter) => filter.queryKey
  )
  const cancelKeys = getFriendMutationInvalidationFilters('alice', 'cancel').map(
    (filter) => filter.queryKey
  )
  const removeKeys = getFriendMutationInvalidationFilters('alice', 'remove').map(
    (filter) => filter.queryKey
  )

  // Then: 交差申請、拒否、解除の影響範囲を分ける。
  assert.deepEqual(requestKeys, [
    ['friendships', 'alice', 'friends'],
    ['friendships', 'alice', 'requests', 'received'],
    ['friendships', 'alice', 'requests', 'sent'],
    ['friend-rankings', 'alice'],
  ])
  assert.deepEqual(acceptKeys, [
    ['friendships', 'alice', 'requests', 'received'],
    ['friendships', 'alice', 'friends'],
    ['friend-rankings', 'alice'],
  ])
  assert.deepEqual(rejectKeys, [['friendships', 'alice', 'requests', 'received']])
  assert.deepEqual(cancelKeys, [['friendships', 'alice', 'requests', 'sent']])
  assert.deepEqual(removeKeys, [
    ['friendships', 'alice', 'friends'],
    ['friend-rankings', 'alice'],
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

test('認証ユーザー変更時は旧ユーザーの一覧とランキングだけを削除する', async () => {
  // Given: aliceとbobのフレンド関連キャッシュ。
  const { clearFriendQueriesForUser, friendshipQueryKeys } = await loadFriendsQuery()
  const queryClient = createTestQueryClient()
  const aliceFriendsKey = friendshipQueryKeys.friends('alice')
  const aliceRankingKey = ['friend-rankings', 'alice', 'song', 'song-1', 'MASTER'] as const
  const bobFriendsKey = friendshipQueryKeys.friends('bob')
  queryClient.setQueryData(aliceFriendsKey, [])
  queryClient.setQueryData(aliceRankingKey, { ranking: [] })
  queryClient.setQueryData(bobFriendsKey, [])

  // When: aliceの認証依存queryを破棄する。
  await clearFriendQueriesForUser(queryClient, 'alice')

  // Then: aliceだけが削除される。
  assert.equal(queryClient.getQueryState(aliceFriendsKey), undefined)
  assert.equal(queryClient.getQueryState(aliceRankingKey), undefined)
  assert.notEqual(queryClient.getQueryState(bobFriendsKey), undefined)
  queryClient.clear()
})
