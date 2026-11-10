import {
  calculateSingleRatingHundredths,
  MAX_RATING_SCORE,
  MIN_RATING_SCORE,
  toRatingHundredths,
} from './singleRating'

const RATING_SCALE = 100

/**
 * 現在の枠内最低レーティングを上回るための目標単曲レーティングを算出する。
 *
 * @param slotRatings - 現在枠に入っている譜面の単曲レーティング一覧。
 * @returns 枠内最低値より0.01高いレーティング。枠が空の場合は未定義。
 */
export const calculateCandidateTargetRating = (
  slotRatings: readonly number[]
): number | undefined => {
  if (slotRatings.length === 0) return undefined

  const minimumRating = Math.min(...slotRatings.map(toRatingHundredths))
  return (minimumRating + 1) / RATING_SCALE
}

/**
 * 指定した単曲レーティングへ到達する最低スコアを二分探索で求める。
 *
 * @param chartConstant - 譜面定数。
 * @param targetRating - 目標単曲レーティング。
 * @returns 目標へ到達する最低スコア。理論値でも届かない場合は未定義。
 */
const calculateMinimumScoreForRating = (
  chartConstant: number,
  targetRating: number
): number | undefined => {
  const targetRatingHundredths = toRatingHundredths(targetRating)
  if (calculateSingleRatingHundredths(MAX_RATING_SCORE, chartConstant) < targetRatingHundredths) {
    return undefined
  }

  let lowerScore = MIN_RATING_SCORE
  let upperScore = MAX_RATING_SCORE

  while (lowerScore < upperScore) {
    const middleScore = Math.floor((lowerScore + upperScore) / 2)
    if (calculateSingleRatingHundredths(middleScore, chartConstant) >= targetRatingHundredths) {
      upperScore = middleScore
    } else {
      lowerScore = middleScore + 1
    }
  }

  return lowerScore
}

/**
 * 候補譜面の現在スコアと枠入りに必要な最低スコアとの差を算出する。
 *
 * @param currentScore - 候補譜面の現在スコア。
 * @param chartConstant - 候補譜面の譜面定数。
 * @param targetRating - 枠入りに必要な目標単曲レーティング。
 * @returns 現在スコアから必要最低スコアを引いた差。到達不能な場合は未定義。
 */
export const calculateCandidateScoreDifference = (
  currentScore: number,
  chartConstant: number,
  targetRating: number
): number | undefined => {
  const minimumScore = calculateMinimumScoreForRating(chartConstant, targetRating)
  return minimumScore === undefined ? undefined : currentScore - minimumScore
}
