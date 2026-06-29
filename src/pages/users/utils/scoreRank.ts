import {
  HIGH_SCORE_RANKS,
  SCORE_RANK_MAX_SCORES,
  SCORE_RANK_MIN_SCORES,
} from '../../../utils/scoreRank'

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

export const SCORE_RANK_MAX_VALUES: Record<ScoreRank, number> = {
  '0点': SCORE_RANK_MIN_SCORES.S - 1,
  S: SCORE_RANK_MAX_SCORES.S,
  'S+': SCORE_RANK_MAX_SCORES['S+'],
  SS: SCORE_RANK_MAX_SCORES.SS,
  'SS+': SCORE_RANK_MAX_SCORES['SS+'],
  SSS: SCORE_RANK_MAX_SCORES.SSS,
  'SSS+': SCORE_RANK_MAX_SCORES['SSS+'],
}

/**
 * スコアをフィルター入力用のランクラベルへ変換する。
 *
 * @param value - 変換対象のスコア。
 * @returns スコアが属するランクラベル。
 */
export const scoreToFilterRank = (value: number): ScoreRank => {
  const highestRank = SCORE_RANKS[SCORE_RANKS.length - 1]
  const normalized = Math.max(
    SCORE_RANK_VALUES['0点'],
    Math.min(value, SCORE_RANK_VALUES[highestRank])
  )

  for (const rank of SCORE_RANKS) {
    const maxValue = filterRankToScore(rank, 'max')
    if (normalized <= maxValue) {
      return rank
    }
  }

  return highestRank
}

/**
 * フィルター入力用のランクラベルを範囲端のスコアへ変換する。
 *
 * @param rank - 変換対象のランクラベル。
 * @param type - 下限または上限。
 * @returns ランクに対応するスコア。
 */
export const filterRankToScore = (rank: ScoreRank, type: 'min' | 'max'): number => {
  if (type === 'max') {
    return SCORE_RANK_MAX_VALUES[rank]
  }

  return SCORE_RANK_VALUES[rank]
}
