import { CHART_SCORES_BASE_URL, FRONTEND_BASE_URL } from '../config'
import type { ChartScoresDifficulty, ChartScoresResponse } from '../types/chartScores'
import { resolveStaticDataBaseUrl } from './chartStats'

const CHART_SCORES_FETCH_ERROR_MESSAGE = '譜面スコア統計の取得に失敗しました'

/**
 * 指定難易度のレート帯別スコア統計を静的配信JSONから取得する。
 *
 * @param difficulty - 取得する通常譜面の難易度。
 * @returns 更新日時と譜面ごとのレート帯別平均・中央値。
 * @throws 通信またはHTTPステータスが失敗した場合。
 */
export const fetchChartScores = async (
  difficulty: ChartScoresDifficulty
): Promise<ChartScoresResponse> => {
  const baseUrl = resolveStaticDataBaseUrl(FRONTEND_BASE_URL, CHART_SCORES_BASE_URL)
  const response = await fetch(`${baseUrl}/v1/chart-scores/${difficulty}.json`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) throw new Error(CHART_SCORES_FETCH_ERROR_MESSAGE)

  return (await response.json()) as ChartScoresResponse
}
