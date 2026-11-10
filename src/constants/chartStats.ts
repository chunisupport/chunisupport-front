import type { PlayerDataDifficulty } from '../types/api'
import type { ChartStatsDifficulty } from '../types/chartStats'

/** 難易度ごとの静的JSONファイル名・ダウンロードファイル名に使う識別子 */
export const CHART_STATS_FILE_KEYS: Record<ChartStatsDifficulty, string> = {
  BASIC: 'BASIC',
  ADVANCED: 'ADVANCED',
  EXPERT: 'EXPERT',
  MASTER: 'MASTER',
  ULTIMA: 'ULTIMA',
  "WORLD'S END": 'WORLDS_END',
}

/** レコード統計の通常難易度（WORLD'S END以外）。表示順 */
export const CHART_STATS_STANDARD_DIFFICULTIES: readonly PlayerDataDifficulty[] = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
  'ULTIMA',
]
