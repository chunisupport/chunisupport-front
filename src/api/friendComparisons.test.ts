import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

test('フレンド比較APIは認証付きで大文字難易度を取得する', async () => {
  // Given: API呼び出しを記録する。
  const controller = new AbortController()
  const calls = installFetchRecorder(() => Response.json({ difficulty: 'MASTER', items: [] }))
  const { fetchFriendComparison } = await loadTestModule(
    (cacheKey) => import(`./friendComparisons.ts?cache=${cacheKey}`),
    { authenticate: true }
  )

  // When: 承認済みフレンドの比較を取得する。
  await fetchFriendComparison('frienduser', 'MASTER', controller.signal)

  // Then: Firebase認証と中断シグナルを含む正しいパスへ送信する。
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/friend-comparisons/frienduser/charts/MASTER'
  )
  assert.equal(new Headers(calls[0]?.init?.headers).get('Authorization'), 'Bearer test-token')
  assert.equal(calls[0]?.init?.signal, controller.signal)
})

test("WORLD'S ENDのフレンド比較は専用APIを認証付きで取得する", async () => {
  // Given: API呼び出しを記録する。
  const controller = new AbortController()
  const calls = installFetchRecorder(() => Response.json({ difficulty: "WORLD'S END", items: [] }))
  const { fetchWorldsendFriendComparison } = await loadTestModule(
    (cacheKey) => import(`./friendComparisons.ts?cache=${cacheKey}`),
    { authenticate: true }
  )

  // When: WORLD'S ENDの比較を取得する。
  const result = await fetchWorldsendFriendComparison('frienduser', controller.signal)

  // Then: 専用パスと認証、中断シグナルを使用する。
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/friend-comparisons/frienduser/worldsend'
  )
  assert.equal(new Headers(calls[0]?.init?.headers).get('Authorization'), 'Bearer test-token')
  assert.equal(calls[0]?.init?.signal, controller.signal)
  assert.equal(result.difficulty, "WORLD'S END")
})
