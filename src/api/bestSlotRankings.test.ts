import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

test('ベスト枠ランキングAPIはレート帯とページング条件をURLへ設定する', async () => {
  // Given: URLエンコードが必要な最上位帯とカーソル。
  const calls = installFetchRecorder(() =>
    Response.json({
      rating_band: '17.6+',
      eligible_player_count: 0,
      ranking: [],
      next_cursor: null,
    })
  )
  const { fetchBestSlotRanking } = await loadTestModule(
    (cacheKey) => import(`./bestSlotRankings.ts?cache=${cacheKey}`)
  )

  // When: キャンセル可能な2ページ目を取得する。
  const controller = new AbortController()
  await fetchBestSlotRanking({
    ratingBand: '17.6+',
    cursor: 'next/value',
    limit: 100,
    signal: controller.signal,
  })

  // Then: すべての条件が安全にエンコードされ、シグナルが引き渡される。
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/best-slot-rankings?rating_band=17.6%2B&limit=100&cursor=next%2Fvalue'
  )
  assert.equal(calls[0]?.init?.signal, controller.signal)
})
