import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * テスト用環境変数を設定する。
 *
 * @returns なし。
 */
const setupApiTestEnv = (): void => {
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

test('管理者向け通常譜面ランキングAPIは表示IDをエンコードして難易度を大文字で送る', async () => {
  // Given: URLエンコードが必要な表示IDとキャンセルシグナル。
  setupApiTestEnv()
  let calledUrl = ''
  let calledSignal: AbortSignal | null | undefined
  globalThis.fetch = async (input, init) => {
    calledUrl = String(input)
    calledSignal = init?.signal
    return Response.json({ song: {}, chart: {}, ranking: [], total: 0 })
  }
  const cacheKey = `${Date.now()}-${Math.random()}`
  const { fetchAdminChartRanking } = await import(`./adminChartRankings.ts?cache=${cacheKey}`)
  const controller = new AbortController()

  // When: 通常譜面ランキングを取得する。
  await fetchAdminChartRanking({
    displayId: 'A/B C',
    difficulty: 'ULTIMA',
    signal: controller.signal,
  })

  // Then: APIパスとキャンセルシグナルが正しく設定される。
  assert.equal(
    calledUrl,
    'http://localhost:3000/internal/admin/chart-rankings/songs/A%2FB%20C/charts/ULTIMA'
  )
  assert.equal(calledSignal, controller.signal)
})

test("管理者向けWORLD'S END譜面ランキングAPIは専用パスを呼び出す", async () => {
  // Given: WORLD'S END譜面の表示ID。
  setupApiTestEnv()
  let calledUrl = ''
  globalThis.fetch = async (input) => {
    calledUrl = String(input)
    return Response.json({ song: {}, chart: {}, ranking: [], total: 0 })
  }
  const cacheKey = `${Date.now()}-${Math.random()}`
  const { fetchAdminChartRanking } = await import(`./adminChartRankings.ts?cache=${cacheKey}`)

  // When: 難易度を指定せずランキングを取得する。
  await fetchAdminChartRanking({ displayId: 'WE/01' })

  // Then: WORLD'S END専用APIパスが呼び出される。
  assert.equal(
    calledUrl,
    'http://localhost:3000/internal/admin/chart-rankings/worldsend-songs/WE%2F01'
  )
})
