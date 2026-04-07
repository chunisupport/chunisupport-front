import { HIGH_SCORE_RANKS, SCORE_RANK_MIN_SCORES } from '../../../../utils/scoreRank'

export type ScoreRank = '0点' | (typeof HIGH_SCORE_RANKS)[number]

export const SCORE_RANKS: ScoreRank[] = ['0点', ...HIGH_SCORE_RANKS]

export const SCORE_RANK_VALUES: Record<ScoreRank, number> = {
  '0点': 0,
  S: SCORE_RANK_MIN_SCORES.S,
  'S+': SCORE_RANK_MIN_SCORES['S+'],
  SS: SCORE_RANK_MIN_SCORES.SS,
  'SS+': SCORE_RANK_MIN_SCORES['SS+'],
  SSS: SCORE_RANK_MIN_SCORES.SSS,
  'SSS+': SCORE_RANK_MIN_SCORES['SSS+'],
}
