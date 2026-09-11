import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createTestCacheKey,
  installFetchRecorder,
  setupTestEnvironment,
} from '../test/setupTestEnvironment'

test('管理者向け通常譜面ランキングAPIは表示IDをエンコードして難易度を大文字で送る', async () => {
  // Given: URLエンコードが必要な表示IDとキャンセルシグナル。
  setupTestEnvironment()
  const calls = installFetchRecorder(() =>
    Response.json({ song: {}, chart: {}, ranking: [], total: 0 })
  )
  const cacheKey = createTestCacheKey()
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
    String(calls[0]?.input),
    'http://localhost:3000/internal/admin/chart-rankings/songs/A%2FB%20C/charts/ULTIMA'
  )
  assert.equal(calls[0]?.init?.signal, controller.signal)
})

test("管理者向けWORLD'S END譜面ランキングAPIは専用パスを呼び出す", async () => {
  // Given: WORLD'S END譜面の表示ID。
  setupTestEnvironment()
  const calls = installFetchRecorder(() =>
    Response.json({ song: {}, chart: {}, ranking: [], total: 0 })
  )
  const cacheKey = createTestCacheKey()
  const { fetchAdminChartRanking } = await import(`./adminChartRankings.ts?cache=${cacheKey}`)

  // When: 難易度を指定せずランキングを取得する。
  await fetchAdminChartRanking({ displayId: 'WE/01' })

  // Then: WORLD'S END専用APIパスが呼び出される。
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/admin/chart-rankings/worldsend-songs/WE%2F01'
  )
})
