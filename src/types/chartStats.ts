import type { PlayerDataDifficulty } from './api'

/** 静的統計JSONで扱う通常難易度とWORLD'S END */
export type ChartStatsDifficulty = PlayerDataDifficulty | "WORLD'S END"

/** スコアランクごとの排他的なプレイヤー数 */
export type ChartStatsRank = {
  max: number
  sssp: number
  sss: number
  ssp: number
  ss: number
  sp: number
  s: number
  aaal: number
}

/** クリアランプごとの排他的なプレイヤー数 */
export type ChartStatsClear = {
  failed: number
  clear: number
  hard: number
  brave: number
  absolute: number
  catastrophy: number
}

/** コンボランプごとの排他的なプレイヤー数 */
export type ChartStatsCombo = {
  none: number
  fc: number
  aj: number
  ajc: number
}

/** 通常譜面とWORLD'S END譜面に共通する統計 */
type ChartStatsBase = {
  song_id: string
  title: string
  player_count: number
  rank: ChartStatsRank
  clear: ChartStatsClear
  combo: ChartStatsCombo
}

/** 通常譜面1件分の統計 */
export type StandardChartStats = ChartStatsBase & {
  const: number
  is_const_unknown: boolean
}

/** WORLD'S END譜面1件分の統計 */
export type WorldsendChartStats = ChartStatsBase & {
  level_star: number | null
  attribute: string | null
}

/** 難易度別の静的統計JSONに含まれる譜面 */
export type ChartStats = StandardChartStats | WorldsendChartStats

/** 難易度別の静的統計JSON */
export type ChartStatsResponse = {
  generated_at: string
  difficulty: ChartStatsDifficulty
  rating_band: 'ALL'
  charts: ChartStats[]
}
