import type { PlayerDataDifficulty } from './api'

/** 静的スコア統計を配信する通常譜面の難易度 */
export type ChartScoresDifficulty = PlayerDataDifficulty

/** 一つのレート帯における譜面スコア統計 */
export interface ChartScoreBand {
  rating_band: string
  average_score: number | null
  median_score: number | null
}

/** 一つの通常譜面におけるレート帯別スコア統計 */
export interface ChartScoreEntry {
  song_id: string
  scores: ChartScoreBand[]
}

/** 難易度別の静的スコア統計JSON */
export interface ChartScoresResponse {
  generated_at: string
  difficulty: ChartScoresDifficulty
  charts: ChartScoreEntry[]
}
