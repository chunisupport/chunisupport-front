export const MAX_SCORE = 1010000

export const SCORE_RANK_MASTER = [
  { rank: 'D', minScore: 0 },
  { rank: 'C', minScore: 500000 },
  { rank: 'B', minScore: 600000 },
  { rank: 'BB', minScore: 700000 },
  { rank: 'BBB', minScore: 800000 },
  { rank: 'A', minScore: 900000 },
  { rank: 'AA', minScore: 925000 },
  { rank: 'AAA', minScore: 950000 },
  { rank: 'S', minScore: 975000 },
  { rank: 'S+', minScore: 990000 },
  { rank: 'SS', minScore: 1000000 },
  { rank: 'SS+', minScore: 1005000 },
  { rank: 'SSS', minScore: 1007500 },
  { rank: 'SSS+', minScore: 1009000 },
] as const

export type ScoreRank = (typeof SCORE_RANK_MASTER)[number]['rank']

export const SCORE_RANK_MIN_SCORES: Record<ScoreRank, number> = Object.fromEntries(
  SCORE_RANK_MASTER.map(({ rank, minScore }) => [rank, minScore])
) as Record<ScoreRank, number>

export const SCORE_RANKS_ASC = SCORE_RANK_MASTER.map(({ rank }) => rank)

export const HIGH_SCORE_RANKS = SCORE_RANKS_ASC.filter(
  (rank): rank is Extract<ScoreRank, 'S' | 'S+' | 'SS' | 'SS+' | 'SSS' | 'SSS+'> =>
    rank === 'S' ||
    rank === 'S+' ||
    rank === 'SS' ||
    rank === 'SS+' ||
    rank === 'SSS' ||
    rank === 'SSS+'
)

export const getScoreRank = (score: number): ScoreRank => {
  const normalized = Math.max(0, Math.min(score, MAX_SCORE))

  for (let index = SCORE_RANK_MASTER.length - 1; index >= 0; index -= 1) {
    const current = SCORE_RANK_MASTER[index]
    if (normalized >= current.minScore) {
      return current.rank
    }
  }

  return 'D'
}
