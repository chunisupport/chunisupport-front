import type { PlayerStatsAchievement } from '../utils/playerStatsDashboard'

/** 達成状況の集計軸（レベル別・譜面定数別） */
export type PlayerStatsHeatmapAxis = 'level' | 'chartConstant'

/** 達成状況の集計軸の切り替え選択肢 */
export const PLAYER_STATS_HEATMAP_AXIS_OPTIONS = [
  { value: 'level', label: 'レベル別' },
  { value: 'chartConstant', label: '譜面定数別' },
] as const satisfies readonly { value: PlayerStatsHeatmapAxis; label: string }[]

/** 累計到達条件の表示名 */
export const PLAYER_STATS_ACHIEVEMENT_LABEL: Record<PlayerStatsAchievement, string> = {
  played: 'プレイ済み',
  s: 'S',
  sPlus: 'S+',
  ss: 'SS',
  ssPlus: 'SS+',
  sss: 'SSS',
  sssPlus: 'SSS+',
  fc: 'FULL COMBO',
  aj: 'ALL JUSTICE',
  ajc: 'ALL JUSTICE CRITICAL',
  max: 'MAX',
  clear: 'CLEAR',
  hard: 'HARD',
  brave: 'BRAVE',
  absolute: 'ABSOLUTE',
  catastrophe: 'CATASTROPHY',
}
