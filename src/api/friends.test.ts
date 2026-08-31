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

test('フレンド一覧APIはAbortSignalをHTTPリクエストへ引き渡す', async () => {
  // Given: 3種類の一覧取得へ共通で渡すAbortSignal。
  const controller = new AbortController()
  const signals: (AbortSignal | null | undefined)[] = []
  globalThis.fetch = async (_input, init) => {
    signals.push(init?.signal)
    return Response.json({ items: [] })
  }

  // When: 各一覧を同じシグナルで取得する。
  const { fetchFriends, fetchReceivedFriendRequests, fetchSentFriendRequests } =
    await loadFriendsApi()
  await fetchFriends(controller.signal)
  await fetchReceivedFriendRequests(controller.signal)
  await fetchSentFriendRequests(controller.signal)

  // Then: TanStack Queryが中断できるよう、すべてのfetchへ同じシグナルが渡る。
  assert.deepEqual(signals, [controller.signal, controller.signal, controller.signal])
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

test('フレンド操作APIはusernameをエンコードして呼び出す', async () => {
  // Given: 操作API呼び出し内容の記録。
  const requests: { url: string; method: string | undefined }[] = []
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), method: init?.method })
    return new Response(null, { status: 204 })
  }

  // When: 承認、拒否、申請取り消し、解除APIを呼び出す。
  const { acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, deleteFriend } =
    await loadFriendsApi()
  await acceptFriendRequest('requester1')
  await rejectFriendRequest('requester2')
  await cancelFriendRequest('targetuser')
  await deleteFriend('frienduser')

  // Then: usernameパスパラメータを使うAPI仕様どおりに呼び出す。
  assert.deepEqual(requests, [
    {
      url: 'http://localhost:3000/internal/friends/requests/requester1/accept',
      method: 'POST',
    },
    {
      url: 'http://localhost:3000/internal/friends/requests/requester2/reject',
      method: 'POST',
    },
    {
      url: 'http://localhost:3000/internal/friends/requests/targetuser',
      method: 'DELETE',
    },
    {
      url: 'http://localhost:3000/internal/friends/frienduser',
      method: 'DELETE',
    },
  ])
})

test('不正なusernameはすべての更新APIで送信前に拒否する', async () => {
  // Given: API呼び出し回数の記録。
  let requestCount = 0
  globalThis.fetch = async () => {
    requestCount += 1
    return new Response(null, { status: 204 })
  }
  const {
    createFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    deleteFriend,
  } = await loadFriendsApi()

  // When & Then: body と各 username パスの不正値を拒否する。
  await assert.rejects(() => createFriendRequest({ username: 'InvalidUser' }), TypeError)
  await assert.rejects(() => acceptFriendRequest('user name'), TypeError)
  await assert.rejects(() => rejectFriendRequest('user_name'), TypeError)
  await assert.rejects(() => cancelFriendRequest('user-1'), TypeError)
  await assert.rejects(() => deleteFriend('user'), TypeError)
  assert.equal(requestCount, 0)
})
