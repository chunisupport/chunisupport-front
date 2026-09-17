import assert from 'node:assert/strict'
import test from 'node:test'

process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
process.env.PUBLIC_FRONTEND_URL = 'https://chunisupport.net/'
process.env.PUBLIC_CHART_SCORES_BASE_URL = 'https://static.chunisup-dev.f5.si/'
process.env.PUBLIC_DOCUMENTATION_URL = 'http://localhost:3000'
process.env.PUBLIC_BOOKMARKLET_URL = 'http://localhost:3000'
process.env.PUBLIC_BOOKMARKLET_ENTRYPOINT = 'main.js'
process.env.PUBLIC_CF_TURNSTILE_SITE_KEY = 'test-site-key'

test('指定した静的配信元から譜面スコア統計を取得する', async () => {
  // Given: ULTIMAの公開統計が取得できる。
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  const payload = { generated_at: '2026-09-17T00:00:00+09:00', difficulty: 'ULTIMA', charts: [] }
  globalThis.fetch = async (input) => {
    requestedUrl = String(input)
    return Response.json(payload)
  }

  try {
    // When: ULTIMAを取得する。
    const { fetchChartScores } = await import('./chartScores.ts')
    const result = await fetchChartScores('ULTIMA')

    // Then: 上書きURLの末尾スラッシュを除いてchart-scoresパスを使う。
    assert.equal(requestedUrl, 'https://static.chunisup-dev.f5.si/v1/chart-scores/ULTIMA.json')
    assert.deepEqual(result, payload)
  } finally {
    globalThis.fetch = originalFetch
  }
})
