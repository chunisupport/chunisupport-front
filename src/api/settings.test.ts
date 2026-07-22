import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * 設定APIテスト用の環境変数と認証状態を設定する。
 *
 * @returns なし。
 */
const setupSettingsApiTest = async (): Promise<void> => {
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
 * モジュール内定数をテストごとに再評価して設定API関数群を読み込む。
 *
 * @returns 設定APIモジュール。
 */
const loadSettingsApi = async () => {
  await setupSettingsApiTest()
  const cacheKey = `${Date.now()}-${Math.random()}`
  return import(`./settings.ts?cache=${cacheKey}`)
}

test('APIトークン一覧は認証付きGETでtokensレスポンスを返す', async () => {
  // Given: APIトークン一覧レスポンスと呼び出し記録。
  const responseBody = { tokens: [] }
  let request: { url: string; method: string | undefined; authorization: string | null } | undefined
  globalThis.fetch = async (input, init) => {
    request = {
      url: String(input),
      method: init?.method,
      authorization: new Headers(init?.headers).get('Authorization'),
    }
    return Response.json(responseBody)
  }

  // When: APIトークン一覧を取得する。
  const { fetchApiTokens } = await loadSettingsApi()
  const result = await fetchApiTokens()

  // Then: 最新仕様の一覧エンドポイントを認証付きで呼び出す。
  assert.deepEqual(result, responseBody)
  assert.deepEqual(request, {
    url: 'http://localhost:3000/internal/auth/api-tokens',
    method: 'GET',
    authorization: 'Bearer test-token',
  })
})

test('APIトークン発行はnameをJSONでPOSTする', async () => {
  // Given: 発行結果とAPI呼び出し記録。
  const responseBody = {
    id: 42,
    name: 'Discord Bot',
    token: 'plain-text-token',
    token_prefix: 'plain',
    last_used_at: null,
    created_at: '2026-07-22T12:34:56+09:00',
  }
  let request:
    | { method: string | undefined; contentType: string | null; body: BodyInit | null | undefined }
    | undefined
  globalThis.fetch = async (_input, init) => {
    request = {
      method: init?.method,
      contentType: new Headers(init?.headers).get('Content-Type'),
      body: init?.body,
    }
    return Response.json(responseBody, { status: 201 })
  }

  // When: 名前付きAPIトークンを発行する。
  const { issueApiToken } = await loadSettingsApi()
  const result = await issueApiToken('Discord Bot')

  // Then: nameをJSONリクエストとして送信し、平文付きレスポンスを返す。
  assert.deepEqual(result, responseBody)
  assert.deepEqual(request, {
    method: 'POST',
    contentType: 'application/json',
    body: JSON.stringify({ name: 'Discord Bot' }),
  })
})

test('APIトークンの名称変更と削除はID指定エンドポイントを使う', async () => {
  // Given: 名称変更レスポンスとAPI呼び出し記録。
  const renamedToken = {
    id: 42,
    name: 'CLI',
    token_prefix: 'plain',
    last_used_at: null,
    created_at: '2026-07-22T12:34:56+09:00',
  }
  const requests: { url: string; method: string | undefined; body: BodyInit | null | undefined }[] =
    []
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), method: init?.method, body: init?.body })
    return init?.method === 'PATCH'
      ? Response.json(renamedToken)
      : new Response(null, { status: 204 })
  }

  // When: ID 42の名称変更と削除を行う。
  const { deleteApiToken, renameApiToken } = await loadSettingsApi()
  const result = await renameApiToken(42, { name: 'CLI' })
  await deleteApiToken(42)

  // Then: PATCHとDELETEの双方でID指定パスを使用する。
  assert.deepEqual(result, renamedToken)
  assert.deepEqual(requests, [
    {
      url: 'http://localhost:3000/internal/auth/api-tokens/42',
      method: 'PATCH',
      body: JSON.stringify({ name: 'CLI' }),
    },
    {
      url: 'http://localhost:3000/internal/auth/api-tokens/42',
      method: 'DELETE',
      body: undefined,
    },
  ])
})
