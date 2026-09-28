import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内定数をテストごとに再評価して譜面統計バッチAPIを読み込む。
 * @returns 譜面統計バッチAPIモジュール。
 */
const loadChartStatsBatchApi = () =>
  loadTestModule((cacheKey) => import(`./chartStatsBatch.ts?cache=${cacheKey}`), {
    authenticate: true,
  })

test('譜面統計バッチの実行履歴APIはキャンセルシグナル付きで管理者APIを呼び出す', async () => {
  // Given: 空の実行履歴を返すAPIとキャンセルシグナル。
  const calls = installFetchRecorder(() => Response.json({ jobs: [] }))
  const { fetchChartStatsBatchJobs } = await loadChartStatsBatchApi()
  const controller = new AbortController()

  // When: 実行履歴を取得する。
  const result = await fetchChartStatsBatchJobs(controller.signal)

  // Then: 管理者APIのパスとシグナルが設定され、レスポンスを返す。
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/admin/chart-stats-batch/jobs'
  )
  assert.equal(calls[0]?.init?.signal, controller.signal)
  assert.deepEqual(result, { jobs: [] })
})

test('譜面統計バッチの実行要求APIはボディなしでPOSTする', async () => {
  // Given: 開始したジョブを返すAPI。
  const calls = installFetchRecorder(() => Response.json({ id: 'job-1', status: 'RUNNING' }))
  const { startChartStatsBatchJob } = await loadChartStatsBatchApi()

  // When: 実行を要求する。
  await startChartStatsBatchJob()

  // Then: 実行条件を持たないため、ボディなしで送信する。
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/admin/chart-stats-batch/jobs'
  )
  assert.equal(calls[0]?.init?.method, 'POST')
  assert.equal(calls[0]?.init?.body, undefined)
})
