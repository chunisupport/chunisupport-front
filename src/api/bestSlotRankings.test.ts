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

test('ベスト枠ランキングAPIはレート帯とページング条件をURLへ設定する', async () => {
  // Given: URLエンコードが必要な最上位帯とカーソル。
  setupApiTestEnv()
  let calledUrl = ''
  globalThis.fetch = async (input) => {
    calledUrl = String(input)
    return Response.json({
      rating_band: '17.6+',
      eligible_player_count: 0,
      ranking: [],
      next_cursor: null,
    })
  }
  const cacheKey = `${Date.now()}-${Math.random()}`
  const { fetchBestSlotRanking } = await import(`./bestSlotRankings.ts?cache=${cacheKey}`)

  // When: 2ページ目を取得する。
  await fetchBestSlotRanking({ ratingBand: '17.6+', cursor: 'next/value', limit: 100 })

  // Then: すべての条件が安全にエンコードされる。
  assert.equal(
    calledUrl,
    'http://localhost:3000/internal/best-slot-rankings?rating_band=17.6%2B&limit=100&cursor=next%2Fvalue'
  )
})
