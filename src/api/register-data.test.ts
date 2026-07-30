import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * 最新更新結果APIテスト用の環境変数と認証状態を設定する。
 *
 * @returns なし。
 */
const setupLatestUpdateApiTest = async (): Promise<void> => {
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
 * モジュール内定数をテストごとに再評価して登録API関数群を読み込む。
 *
 * @returns 登録APIモジュール。
 */
const loadRegisterDataApi = async () => {
  await setupLatestUpdateApiTest()
  const cacheKey = `${Date.now()}-${Math.random()}`
  return import(`./register-data.ts?cache=${cacheKey}`)
}

test('最新更新結果APIは保存済み結果を認証付きで取得する', async () => {
  // Given: 保存済み結果とAPI呼び出し記録。
  const responseBody = { schema_version: 1, changes: [] }
  let request: { url: string; authorization: string | null } | undefined
  globalThis.fetch = async (input, init) => {
    request = {
      url: String(input),
      authorization: new Headers(init?.headers).get('Authorization'),
    }
    return Response.json(responseBody)
  }

  // When: 最新更新結果を取得する。
  const { fetchLatestPlayerDataUpdate } = await loadRegisterDataApi()
  const result = await fetchLatestPlayerDataUpdate()

  // Then: 本人用エンドポイントへ認証付きでアクセスし、レスポンスを返す。
  assert.deepEqual(result, responseBody)
  assert.deepEqual(request, {
    url: 'http://localhost:3000/internal/me/player-data/latest-update',
    authorization: 'Bearer test-token',
  })
})

test('最新更新結果APIは保存済み結果がない204レスポンスをnullへ変換する', async () => {
  // Given: 保存済み結果がないAPIレスポンス。
  globalThis.fetch = async () => new Response(null, { status: 204 })

  // When: 最新更新結果を取得する。
  const { fetchLatestPlayerDataUpdate } = await loadRegisterDataApi()
  const result = await fetchLatestPlayerDataUpdate()

  // Then: 画面で空状態として扱えるnullを返す。
  assert.equal(result, null)
})

test('最新更新結果APIは未対応のスキーマバージョンを拒否する', async () => {
  // Given: フロントエンドが対応していない形式の保存済み結果。
  globalThis.fetch = async () => Response.json({ schema_version: 3 })

  // When: 最新更新結果を取得する。
  const { fetchLatestPlayerDataUpdate } = await loadRegisterDataApi()

  // Then: 不完全な結果を描画せず、呼び出し側へエラーとして通知する。
  await assert.rejects(fetchLatestPlayerDataUpdate, /保存済み更新結果の形式に対応していません。/)
})
