import { API_BASE_URL } from '../config'
import type { SongBatchJobDTO, SongBatchJobListDTO, StartSongBatchJobRequest } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

const ADMIN_SONG_BATCH_JOBS_API_PATH = `${API_BASE_URL}/internal/admin/song-batch/jobs`

/**
 * 楽曲バッチの直近の実行履歴を取得する。
 *
 * @param signal - 画面離脱時に取得を中断するシグナル。
 * @returns 開始日時の新しい順に並んだジョブ一覧。
 */
export const fetchSongBatchJobs = async (signal?: AbortSignal): Promise<SongBatchJobListDTO> => {
  const response = await fetchWithAuth(ADMIN_SONG_BATCH_JOBS_API_PATH, {
    signal,
    requireAuthentication: true,
  })
  return response.json()
}

/**
 * 楽曲バッチの実行を要求する。処理はサーバー側でバックグラウンド実行される。
 *
 * @param request - 実行モードとリリース日補完の有無。
 * @returns 開始したジョブ。
 */
export const startSongBatchJob = async (
  request: StartSongBatchJobRequest
): Promise<SongBatchJobDTO> => {
  const response = await fetchWithAuth(ADMIN_SONG_BATCH_JOBS_API_PATH, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    requireAuthentication: true,
  })
  return response.json()
}
