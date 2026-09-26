import { SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_PHRASE } from '../constants/songBatch'
import type { SongBatchJobDTO, SongBatchJobStatus, SongBatchMode } from '../types/api'

/** 楽曲バッチジョブの状態を表示する色調 */
export type SongBatchStatusTone = 'info' | 'success' | 'warning' | 'danger'

const MILLISECONDS_PER_SECOND = 1_000
const SECONDS_PER_MINUTE = 60

/**
 * 実行履歴から実行中のジョブを探す。
 *
 * @param jobs - 楽曲バッチの実行履歴。
 * @returns 実行中のジョブ。存在しない場合は null。
 */
export const findRunningSongBatchJob = (jobs: readonly SongBatchJobDTO[]): SongBatchJobDTO | null =>
  jobs.find((job) => job.status === 'RUNNING') ?? null

/**
 * 実行モードに応じた確認入力を満たしているか判定する。
 * 大型アップデートは譜面定数を不明化するため、確認文言の入力を必須にする。
 *
 * @param mode - 実行する楽曲バッチのモード。
 * @param input - 確認欄へ入力された文字列。
 * @returns 実行してよい場合は true。
 */
export const isSongBatchConfirmationSatisfied = (mode: SongBatchMode, input: string): boolean =>
  mode !== 'MAJOR_UPDATE' || input.trim() === SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_PHRASE

/**
 * 終了したジョブの所要時間を分と秒で整形する。
 *
 * @param job - 楽曲バッチジョブ。
 * @returns 「3分10秒」形式の所要時間。実行中または日時が不正な場合は null。
 */
export const formatSongBatchDuration = (job: SongBatchJobDTO): string | null => {
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
 * @param status - 楽曲バッチジョブの状態。
 * @returns 状態に対応する色調。
 */
export const resolveSongBatchStatusTone = (status: SongBatchJobStatus): SongBatchStatusTone => {
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
