import type { BatchJobDTO, BatchJobStatus } from '../types/api'

/** バッチジョブの状態を表示する色調 */
export type BatchJobStatusTone = 'info' | 'success' | 'warning' | 'danger'

const MILLISECONDS_PER_SECOND = 1_000
const SECONDS_PER_MINUTE = 60

/**
 * 実行履歴から実行中のジョブを探す。
 *
 * @param jobs - バッチの実行履歴。
 * @returns 実行中のジョブ。存在しない場合は null。
 */
export const findRunningBatchJob = <TJob extends BatchJobDTO>(jobs: readonly TJob[]): TJob | null =>
  jobs.find((job) => job.status === 'RUNNING') ?? null

/**
 * 終了したジョブの所要時間を分と秒で整形する。
 *
 * @param job - バッチジョブ。
 * @returns 「3分10秒」形式の所要時間。実行中または日時が不正な場合は null。
 */
export const formatBatchJobDuration = (
  job: Pick<BatchJobDTO, 'started_at' | 'finished_at'>
): string | null => {
  if (job.finished_at === null) return null

  const elapsedMs = new Date(job.finished_at).getTime() - new Date(job.started_at).getTime()
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return null

  const totalSeconds = Math.round(elapsedMs / MILLISECONDS_PER_SECOND)
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE
  return minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`
}

/**
 * ジョブの状態を表示用の色調へ変換する。
 *
 * @param status - バッチジョブの状態。
 * @returns 状態に対応する色調。
 */
export const resolveBatchJobStatusTone = (status: BatchJobStatus): BatchJobStatusTone => {
  switch (status) {
    case 'RUNNING':
      return 'info'
    case 'SUCCEEDED':
      return 'success'
    case 'SUCCEEDED_WITH_WARNINGS':
      return 'warning'
    case 'FAILED':
    case 'INTERRUPTED':
      return 'danger'
  }
}
