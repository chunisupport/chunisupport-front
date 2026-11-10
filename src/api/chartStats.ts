import { CHART_STATS_BASE_URL, FRONTEND_BASE_URL } from '../config'
import { CHART_STATS_FILE_KEYS } from '../constants/chartStats'
import type { ChartStatsDifficulty, ChartStatsResponse } from '../types/chartStats'

const CHART_STATS_FETCH_ERROR_MESSAGE = 'レコード統計の取得に失敗しました'

/**
 * フロントエンドURLから同一環境の静的データ配信元を生成する。
 *
 * @param frontendBaseUrl - 環境ごとのフロントエンドURL。
 * @param configuredBaseUrl - 環境変数で明示された静的データ配信元。
 * @returns 明示された配信元、またはホスト名へstatic.を付けた配信元。
 */
export const resolveStaticDataBaseUrl = (
  frontendBaseUrl: string,
  configuredBaseUrl?: string
): string => {
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, '')

  const url = new URL(frontendBaseUrl)
  url.hostname = `static.${url.hostname}`
  url.pathname = ''
  url.search = ''
  url.hash = ''
  return url.toString().replace(/\/$/, '')
}

/**
 * 指定難易度の全譜面レコード統計を静的配信JSONから取得する。
 *
 * @param difficulty - 取得する難易度。
 * @param signal - 取得を中断するためのシグナル。
 * @returns 更新日時と全譜面統計を含むレスポンス。
 * @throws 通信に失敗した場合、またはHTTPエラーの場合。
 */
export const fetchChartStats = async (
  difficulty: ChartStatsDifficulty,
  signal?: AbortSignal
): Promise<ChartStatsResponse> => {
  const baseUrl = resolveStaticDataBaseUrl(FRONTEND_BASE_URL, CHART_STATS_BASE_URL)
  const response = await fetch(
    `${baseUrl}/v1/chart-stats/${CHART_STATS_FILE_KEYS[difficulty]}.json`,
    { headers: { Accept: 'application/json' }, signal }
  )

  if (!response.ok) throw new Error(CHART_STATS_FETCH_ERROR_MESSAGE)

  return (await response.json()) as ChartStatsResponse
}
