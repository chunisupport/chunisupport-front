import assert from 'node:assert/strict'
import test from 'node:test'

process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
process.env.PUBLIC_FRONTEND_URL = 'https://chunisupport.net/'
process.env.PUBLIC_DOCUMENTATION_URL = 'http://localhost:3000'
process.env.PUBLIC_BOOKMARKLET_URL = 'http://localhost:3000'
process.env.PUBLIC_BOOKMARKLET_ENTRYPOINT = 'main.js'
process.env.PUBLIC_CF_TURNSTILE_SITE_KEY = 'test-site-key'

const loadChartStatsApi = () => import(`./chartStats.ts?cache=${crypto.randomUUID()}`)

test('フロントエンドURLから同一環境の静的データURLを生成すること', async () => {
  // Given
  const { resolveStaticDataBaseUrl } = await loadChartStatsApi()

  // When
  const production = resolveStaticDataBaseUrl('https://chunisupport.net/')
  const development = resolveStaticDataBaseUrl('https://chunisup-dev.f5.si/path?x=1')

  // Then
  assert.equal(production, 'https://static.chunisupport.net')
  assert.equal(development, 'https://static.chunisup-dev.f5.si')
})

test("WORLD'S ENDはWORLDS_END.jsonから取得すること", async () => {
  // Given
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  globalThis.fetch = async (input) => {
    requestedUrl = String(input)
    return Response.json({
      generated_at: '2026-09-15T18:00:40+09:00',
      difficulty: "WORLD'S END",
      rating_band: 'ALL',
      charts: [],
    })
  }

  try {
    const { fetchChartStats } = await loadChartStatsApi()

    // When
    await fetchChartStats("WORLD'S END")

    // Then
    assert.equal(requestedUrl, 'https://static.chunisupport.net/v1/chart-stats/WORLDS_END.json')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('通常難易度は難易度名と同じJSONから取得すること', async () => {
  // Given
  const originalFetch = globalThis.fetch
  const requestedUrls: string[] = []
  globalThis.fetch = async (input) => {
    requestedUrls.push(String(input))
    return Response.json({
      generated_at: '2026-09-15T18:00:40+09:00',
      difficulty: 'MASTER',
      rating_band: 'ALL',
      charts: [],
    })
  }

  try {
    const { fetchChartStats } = await loadChartStatsApi()

    // When
    await fetchChartStats('BASIC')
    await fetchChartStats('ADVANCED')
    await fetchChartStats('EXPERT')
    await fetchChartStats('MASTER')
    await fetchChartStats('ULTIMA')

    // Then
    assert.deepEqual(requestedUrls, [
      'https://static.chunisupport.net/v1/chart-stats/BASIC.json',
      'https://static.chunisupport.net/v1/chart-stats/ADVANCED.json',
      'https://static.chunisupport.net/v1/chart-stats/EXPERT.json',
      'https://static.chunisupport.net/v1/chart-stats/MASTER.json',
      'https://static.chunisupport.net/v1/chart-stats/ULTIMA.json',
    ])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('静的統計JSONのHTTPエラーを取得失敗として扱うこと', async () => {
  // Given
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(null, { status: 503 })

  try {
    const { fetchChartStats } = await loadChartStatsApi()

    // When & Then
    await assert.rejects(
      () => fetchChartStats('MASTER'),
      new Error('レコード統計の取得に失敗しました')
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
