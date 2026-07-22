const RATING_SCALE = 100
const MIN_SCORE = 0
const MAX_SCORE = 1_010_000

/**
 * 単曲レーティングを計算用の0.01単位へ変換する。
 *
 * @param rating - 変換する単曲レーティング。
 * @returns 0.01を1とした整数値。
 */
const toRatingHundredths = (rating: number): number => Math.round(rating * RATING_SCALE)

/**
 * スコアと譜面定数から単曲レーティングを0.01単位で算出する。
 *
 * @param score - 算出対象のスコア。
 * @param chartConstant - 譜面定数。
 * @returns 小数点以下2桁で切り捨てた単曲レーティングの0.01単位整数値。
 */
const calculateSingleRatingHundredths = (score: number, chartConstant: number): number => {
  const chartConstantTenths = Math.round(chartConstant * 10)
  const baseRating = chartConstantTenths * 10
  let rating = 0

  if (score >= 1_009_000) {
    rating = baseRating + 215
  } else if (score >= 1_007_500) {
    rating = baseRating + 200 + Math.floor((score - 1_007_500) / 100)
  } else if (score >= 1_005_000) {
    rating = baseRating + 150 + Math.floor((score - 1_005_000) / 50)
  } else if (score >= 1_000_000) {
    rating = baseRating + 100 + Math.floor((score - 1_000_000) / 100)
  } else if (score >= 990_000) {
    rating = baseRating + 60 + Math.floor((score - 990_000) / 250)
  } else if (score >= 975_000) {
    rating = baseRating + Math.floor((score - 975_000) / 250)
  } else if (score >= 950_000) {
    rating = baseRating - 167 + Math.floor((score - 950_000) / 150)
  } else if (score >= 925_000) {
    rating = baseRating - 334 + Math.floor((score - 925_000) / 150)
  } else if (score >= 900_000) {
    rating = baseRating - 500 + Math.floor((score - 900_000) / 150)
  } else if (score >= 800_000) {
    const constantDifference = chartConstantTenths - 50
    if (constantDifference > 0) {
      rating =
        constantDifference * 5 + Math.floor(((score - 800_000) * constantDifference) / 20_000)
    }
  } else if (score >= 500_000) {
    const constantDifference = chartConstantTenths - 50
    if (constantDifference > 0) {
      rating = Math.floor(((score - 500_000) * constantDifference) / 60_000)
    }
  }

  return Math.max(rating, 0)
}

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
  if (calculateSingleRatingHundredths(MAX_SCORE, chartConstant) < targetRatingHundredths) {
    return undefined
  }

  let lowerScore = MIN_SCORE
  let upperScore = MAX_SCORE

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
