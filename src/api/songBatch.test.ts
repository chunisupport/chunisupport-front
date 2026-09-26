import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内定数をテストごとに再評価して楽曲バッチAPIを読み込む。
 * @returns 楽曲バッチAPIモジュール。
 */
const loadSongBatchApi = () =>
  loadTestModule((cacheKey) => import(`./songBatch.ts?cache=${cacheKey}`), { authenticate: true })

test('楽曲バッチの実行履歴APIはキャンセルシグナル付きで管理者APIを呼び出す', async () => {
  // Given: 空の実行履歴を返すAPIとキャンセルシグナル。
  const calls = installFetchRecorder(() => Response.json({ jobs: [] }))
  const { fetchSongBatchJobs } = await loadSongBatchApi()
  const controller = new AbortController()

  // When: 実行履歴を取得する。
  const result = await fetchSongBatchJobs(controller.signal)

  // Then: 管理者APIのパスとシグナルが設定され、レスポンスを返す。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/admin/song-batch/jobs')
  assert.equal(calls[0]?.init?.signal, controller.signal)
  assert.deepEqual(result, { jobs: [] })
})

test('楽曲バッチの実行要求APIは実行条件をJSONでPOSTする', async () => {
  // Given: 開始したジョブを返すAPI。
  const calls = installFetchRecorder(() => Response.json({ id: 'job-1', status: 'RUNNING' }))
  const { startSongBatchJob } = await loadSongBatchApi()

  // When: 大型アップデートを要求する。
  await startSongBatchJob({ mode: 'MAJOR_UPDATE', fill_missing_release_date: false })

  // Then: 実行条件をJSONボディとして送信する。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/admin/song-batch/jobs')
  assert.equal(calls[0]?.init?.method, 'POST')
  assert.equal(
    calls[0]?.init?.body,
    JSON.stringify({ mode: 'MAJOR_UPDATE', fill_missing_release_date: false })
  )
})
