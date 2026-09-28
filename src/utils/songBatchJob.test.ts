import assert from 'node:assert/strict'
import test from 'node:test'
import { SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_DELAY_SECONDS } from '../constants/songBatch'
import type { SongBatchJobDTO } from '../types/api'
import {
  findRunningSongBatchJob,
  formatSongBatchDuration,
  getSongBatchConfirmationDelaySeconds,
  isSongBatchModeAvailable,
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

test('通常実行はメンテナンス状態に関わらず選択できること', () => {
  // Given
  const maintenanceStates = [true, false]

  // When
  const results = maintenanceStates.map((isMaintenance) =>
    isSongBatchModeAvailable('NORMAL', isMaintenance)
  )

  // Then
  assert.deepEqual(results, [true, true])
})

test('大型アップデートはメンテナンス中だけ選択できること', () => {
  // Given
  const maintenanceStates = [true, false]

  // When
  const results = maintenanceStates.map((isMaintenance) =>
    isSongBatchModeAvailable('MAJOR_UPDATE', isMaintenance)
  )

  // Then
  assert.deepEqual(results, [true, false])
})

test('大型アップデートだけ確認後の待機時間を設けること', () => {
  // Given
  const modes = ['NORMAL', 'MAJOR_UPDATE'] as const

  // When
  const results = modes.map((mode) => getSongBatchConfirmationDelaySeconds(mode))

  // Then
  assert.deepEqual(results, [0, SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_DELAY_SECONDS])
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
