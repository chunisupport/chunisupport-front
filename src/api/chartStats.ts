import { CHART_STATS_BASE_URL, FRONTEND_BASE_URL } from '../config'
import type { ChartStatsDifficulty, ChartStatsResponse } from '../types/chartStats'

const CHART_STATS_FETCH_ERROR_MESSAGE = 'レコード統計の取得に失敗しました'

/** 難易度と静的JSONファイル名の対応 */
const CHART_STATS_FILE_NAME: Record<ChartStatsDifficulty, string> = {
  BASIC: 'BASIC',
  ADVANCED: 'ADVANCED',
  EXPERT: 'EXPERT',
  MASTER: 'MASTER',
  ULTIMA: 'ULTIMA',
  "WORLD'S END": 'WORLDS_END',
}

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
 * @returns 更新日時と全譜面統計を含むレスポンス。
 * @throws 通信に失敗した場合、またはHTTPエラーの場合。
 */
export const fetchChartStats = async (
  difficulty: ChartStatsDifficulty
): Promise<ChartStatsResponse> => {
  const baseUrl = resolveStaticDataBaseUrl(FRONTEND_BASE_URL, CHART_STATS_BASE_URL)
  const response = await fetch(
    `${baseUrl}/v1/chart-stats/${CHART_STATS_FILE_NAME[difficulty]}.json`,
    { headers: { Accept: 'application/json' } }
  )

  if (!response.ok) throw new Error(CHART_STATS_FETCH_ERROR_MESSAGE)

  return (await response.json()) as ChartStatsResponse
}
