import { CHART_SCORES_BASE_URL, FRONTEND_BASE_URL } from '../config'
import { t } from '../i18n'
import type { ChartScoresDifficulty, ChartScoresResponse } from '../types/chartScores'
import { resolveStaticDataBaseUrl } from './chartStats'

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

  if (!response.ok) throw new Error(t('errors.chartScoresFetchFailed'))

  return (await response.json()) as ChartScoresResponse
}
