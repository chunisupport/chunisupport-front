import assert from 'node:assert/strict'
import test from 'node:test'
import type { SongBatchJobDTO } from '../types/api'
import {
  findRunningSongBatchJob,
  formatSongBatchDuration,
  isSongBatchConfirmationSatisfied,
  resolveSongBatchStatusTone,
} from './songBatchJob'

/**
 * テスト用の楽曲バッチジョブを生成する。
 *
 * @param overrides - 既定値から変更する項目。
 * @returns 楽曲バッチジョブ。
 */
const createJob = (overrides: Partial<SongBatchJobDTO> = {}): SongBatchJobDTO => ({
  id: 'job-1',
  mode: 'NORMAL',
  fill_missing_release_date: false,
  trigger: 'CLI',
  requested_by: null,
  status: 'SUCCEEDED',
  started_at: '2026-09-26T03:00:00Z',
  finished_at: '2026-09-26T03:03:10Z',
  warning_count: 0,
  error_message: null,
  ...overrides,
})

test('実行中のジョブがある場合はそのジョブを返すこと', () => {
  // Given
  const running = createJob({ id: 'running', status: 'RUNNING', finished_at: null })
  const jobs = [running, createJob({ id: 'finished' })]

  // When
  const result = findRunningSongBatchJob(jobs)

  // Then
  assert.equal(result, running)
})

test('実行中のジョブがない場合はnullを返すこと', () => {
  // Given
  const jobs = [createJob(), createJob({ id: 'failed', status: 'FAILED' })]

  // When
  const result = findRunningSongBatchJob(jobs)

  // Then
  assert.equal(result, null)
})

test('通常実行は確認文言なしで実行できること', () => {
  // Given
  const input = ''

  // When
  const result = isSongBatchConfirmationSatisfied('NORMAL', input)

  // Then
  assert.equal(result, true)
})

test('大型アップデートは確認文言が一致した場合だけ実行できること', () => {
  // Given
  const inputs = ['', '大型', ' 大型アップデート ', '大型アップデート']

  // When
  const results = inputs.map((input) => isSongBatchConfirmationSatisfied('MAJOR_UPDATE', input))

  // Then
  assert.deepEqual(results, [false, false, true, true])
})

test('所要時間を分と秒で表示すること', () => {
  // Given
  const job = createJob({ started_at: '2026-09-26T03:00:00Z', finished_at: '2026-09-26T03:03:10Z' })

  // When
  const result = formatSongBatchDuration(job)

  // Then
  assert.equal(result, '3分10秒')
})

test('1分未満の所要時間は秒だけで表示すること', () => {
  // Given
  const job = createJob({ started_at: '2026-09-26T03:00:00Z', finished_at: '2026-09-26T03:00:42Z' })

  // When
  const result = formatSongBatchDuration(job)

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
  const results = jobs.map((job) => formatSongBatchDuration(job))

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
  const results = statuses.map((status) => resolveSongBatchStatusTone(status))

  // Then
  assert.deepEqual(results, ['info', 'success', 'warning', 'danger', 'danger'])
})
