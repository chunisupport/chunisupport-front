import assert from 'node:assert/strict'
import test from 'node:test'
import type { BatchJobDTO } from '../types/api'
import { findRunningBatchJob, formatBatchJobDuration, resolveBatchJobStatusTone } from './batchJob'

/**
 * テスト用のバッチジョブを生成する。
 *
 * @param overrides - 既定値から変更する項目。
 * @returns バッチジョブ。
 */
const createJob = (overrides: Partial<BatchJobDTO> = {}): BatchJobDTO => ({
  id: 'job-1',
  trigger: 'CLI',
  requested_by: null,
  status: 'SUCCEEDED',
  started_at: '2026-09-26T03:00:00Z',
  finished_at: '2026-09-26T03:03:10Z',
  error_message: null,
  ...overrides,
})

test('実行中のジョブがある場合はそのジョブを返すこと', () => {
  // Given
  const running = createJob({ id: 'running', status: 'RUNNING', finished_at: null })
  const jobs = [running, createJob({ id: 'finished' })]

  // When
  const result = findRunningBatchJob(jobs)

  // Then
  assert.equal(result, running)
})

test('実行中のジョブがない場合はnullを返すこと', () => {
  // Given
  const jobs = [createJob(), createJob({ id: 'failed', status: 'FAILED' })]

  // When
  const result = findRunningBatchJob(jobs)

  // Then
  assert.equal(result, null)
})

test('所要時間を分と秒で表示すること', () => {
  // Given
  const job = createJob({ started_at: '2026-09-26T03:00:00Z', finished_at: '2026-09-26T03:03:10Z' })

  // When
  const result = formatBatchJobDuration(job)

  // Then
  assert.equal(result, '3分10秒')
})

test('1分未満の所要時間は秒だけで表示すること', () => {
  // Given
  const job = createJob({ started_at: '2026-09-26T03:00:00Z', finished_at: '2026-09-26T03:00:42Z' })

  // When
  const result = formatBatchJobDuration(job)

  // Then
  assert.equal(result, '42秒')
})

test('終了していないジョブや不正な日時の所要時間はnullを返すこと', () => {
  // Given
  const jobs = [
    createJob({ status: 'RUNNING', finished_at: null }),
    createJob({ finished_at: 'not-a-date' }),
    createJob({ started_at: '2026-09-26T03:00:10Z', finished_at: '2026-09-26T03:00:00Z' }),
  ]

  // When
  const results = jobs.map((job) => formatBatchJobDuration(job))

  // Then
  assert.deepEqual(results, [null, null, null])
})

test('ジョブの状態を表示用の色調へ変換すること', () => {
  // Given
  const statuses = [
    'RUNNING',
    'SUCCEEDED',
    'SUCCEEDED_WITH_WARNINGS',
    'FAILED',
    'INTERRUPTED',
  ] as const

  // When
  const results = statuses.map((status) => resolveBatchJobStatusTone(status))

  // Then
  assert.deepEqual(results, ['info', 'success', 'warning', 'danger', 'danger'])
})
