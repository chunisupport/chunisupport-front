import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * テスト用の環境変数を設定する。
 *
 * @returns なし。
 */
const setupApiTestEnv = (): void => {
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_FB_API_KEY = 'test-api-key'
  process.env.PUBLIC_FB_AUTH_DOMAIN = 'test.firebaseapp.com'
  process.env.PUBLIC_FB_PROJECT_ID = 'test-project'
  process.env.PUBLIC_FB_STORAGE_BUCKET = 'test.appspot.com'
  process.env.PUBLIC_FB_MESSAGING_SENDER_ID = '123456789'
  process.env.PUBLIC_FB_APP_ID = 'test-app-id'
}

/**
 * モジュール内キャッシュをテストごとに分離して fetchVersions を読み込む。
 *
 * @returns fetchVersions 関数。
 */
const loadFetchVersions = async () => {
  setupApiTestEnv()
  const cacheKey = `${Date.now()}-${Math.random()}`
  const { fetchVersions } = await import(`./songs.ts?cache=${cacheKey}`)
  return fetchVersions
}

test('fetchVersions は一度取得したバージョン一覧をセッション中に再利用する', async () => {
  const responseBody = {
    versions: [{ name: 'CHUNITHM VERSE', released_at: '2024-12-12' }],
  }
  let fetchCount = 0

  globalThis.fetch = async () => {
    fetchCount += 1
    return Response.json(responseBody)
  }

  const fetchVersions = await loadFetchVersions()

  const first = await fetchVersions()
  const second = await fetchVersions()

  assert.equal(fetchCount, 1)
  assert.equal(first, second)
  assert.deepEqual(second, responseBody)
})

test('fetchVersions は同時呼び出しを同じリクエストにまとめる', async () => {
  const responseBody = {
    versions: [{ name: 'CHUNITHM LUMINOUS', released_at: '2023-12-14' }],
  }
  let fetchCount = 0

  globalThis.fetch = async () => {
    fetchCount += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return Response.json(responseBody)
  }

  const fetchVersions = await loadFetchVersions()

  const [first, second] = await Promise.all([fetchVersions(), fetchVersions()])

  assert.equal(fetchCount, 1)
  assert.equal(first, second)
  assert.deepEqual(second, responseBody)
})
