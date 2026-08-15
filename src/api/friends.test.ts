import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * フレンドAPIテスト用の環境変数を設定する。
 *
 * @returns なし。
 */
const setupFriendsApiTestEnv = (): void => {
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
 * @returns なし。
 */
const setupAuthenticatedFirebase = async (): Promise<void> => {
  const { auth } = await import('../lib/firebase.ts')
  Object.defineProperty(auth, 'authStateReady', {
    configurable: true,
    value: async () => undefined,
  })
  Object.defineProperty(auth, 'currentUser', {
    configurable: true,
    value: {
      getIdToken: async () => 'test-token',
    },
  })
}

/**
 * モジュール内定数をテストごとに再評価して friends API 関数群を読み込む。
 *
 * @returns friends API モジュール。
 */
const loadFriendsApi = async () => {
  setupFriendsApiTestEnv()
  await setupAuthenticatedFirebase()
  const cacheKey = `${Date.now()}-${Math.random()}`
  return import(`./friends.ts?cache=${cacheKey}`)
}

test('フレンド一覧APIは認証付きGETでitemsレスポンスを返す', async () => {
  // Given: フレンド一覧APIのレスポンスと呼び出し記録。
  const responseBody = { items: [] }
  const requests: { url: string; method: string | undefined; authorization: string | null }[] = []
  globalThis.fetch = async (input, init) => {
    const headers = new Headers(init?.headers)
    requests.push({
      url: String(input),
      method: init?.method,
      authorization: headers.get('Authorization'),
    })
    return Response.json(responseBody)
  }

  // When: フレンド一覧を取得する。
  const { fetchFriends } = await loadFriendsApi()
  const result = await fetchFriends()

  // Then: 仕様どおりのURLとメソッドで呼び出し、レスポンスを返す。
  assert.deepEqual(result, responseBody)
  assert.deepEqual(requests, [
    {
      url: 'http://localhost:3000/internal/friends',
      method: 'GET',
      authorization: 'Bearer test-token',
    },
  ])
})

test('フレンド申請APIはusernameをPOSTする', async () => {
  // Given: API呼び出し内容の記録。
  const requests: { url: string; method: string | undefined; body: BodyInit | null | undefined }[] =
    []
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), method: init?.method, body: init?.body })
    return new Response(null, { status: 204 })
  }

  // When: フレンド申請を作成する。
  const { createFriendRequest } = await loadFriendsApi()
  await createFriendRequest({ username: 'targetuser' })

  // Then: username完全一致申請のAPI仕様どおりに送信する。
  assert.deepEqual(requests, [
    {
      url: 'http://localhost:3000/internal/friends/requests',
      method: 'POST',
      body: JSON.stringify({ username: 'targetuser' }),
    },
  ])
})

test('フレンド操作APIはuser_idをエンコードして呼び出す', async () => {
  // Given: 操作API呼び出し内容の記録。
  const requests: { url: string; method: string | undefined }[] = []
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), method: init?.method })
    return new Response(null, { status: 204 })
  }

  // When: 承認、拒否、申請取り消し、解除APIを呼び出す。
  const { acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, deleteFriend } =
    await loadFriendsApi()
  await acceptFriendRequest(123)
  await rejectFriendRequest(456)
  await cancelFriendRequest(654)
  await deleteFriend(789)

  // Then: user_idパスパラメータを使うAPI仕様どおりに呼び出す。
  assert.deepEqual(requests, [
    {
      url: 'http://localhost:3000/internal/friends/requests/123/accept',
      method: 'POST',
    },
    {
      url: 'http://localhost:3000/internal/friends/requests/456/reject',
      method: 'POST',
    },
    {
      url: 'http://localhost:3000/internal/friends/requests/654',
      method: 'DELETE',
    },
    {
      url: 'http://localhost:3000/internal/friends/789',
      method: 'DELETE',
    },
  ])
})
