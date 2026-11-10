import { API_BASE_URL } from '../config'
import type { ChartStatsBatchJobDTO, ChartStatsBatchJobListDTO } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

const ADMIN_CHART_STATS_BATCH_JOBS_API_PATH = `${API_BASE_URL}/internal/admin/chart-stats-batch/jobs`

/**
 * 譜面統計バッチの直近の実行履歴を取得する。
 *
 * @param signal - 画面離脱時に取得を中断するシグナル。
 * @returns 開始日時の新しい順に並んだジョブ一覧。
 */
export const fetchChartStatsBatchJobs = async (
  signal?: AbortSignal
): Promise<ChartStatsBatchJobListDTO> => {
  const response = await fetchWithAuth(ADMIN_CHART_STATS_BATCH_JOBS_API_PATH, {
    signal,
    requireAuthentication: true,
  })
  return response.json()
}

/**
 * 譜面統計バッチの実行を要求する。実行条件はなく、処理はサーバー側でバックグラウンド実行される。
 *
 * @returns 開始したジョブ。
 */
export const startChartStatsBatchJob = async (): Promise<ChartStatsBatchJobDTO> => {
  const response = await fetchWithAuth(ADMIN_CHART_STATS_BATCH_JOBS_API_PATH, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    requireAuthentication: true,
  })
  return response.json()
}
