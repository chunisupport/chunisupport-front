const CHART_CONSTANT_SCALE = 10
const RATING_SCALE = 100

/** 単曲レーティングの計算対象となる最低スコア。 */
export const MIN_RATING_SCORE = 0
/** 単曲レーティングが理論値となる最大スコア。 */
export const MAX_RATING_SCORE = 1_010_000
/** 理論スコア時に譜面定数へ加算される単曲レーティング。 */
export const THEORETICAL_RATING_BONUS_HUNDREDTHS = 215

/**
 * 単曲レーティングを計算用の0.01単位へ変換する。
 *
 * @param rating - 変換する単曲レーティング。
 * @returns 0.01を1とした整数値。
 */
export const toRatingHundredths = (rating: number): number => Math.round(rating * RATING_SCALE)

/**
 * スコアと譜面定数から単曲レーティングを0.01単位で算出する。
 *
 * @param score - 算出対象のスコア。
 * @param chartConstant - 譜面定数。
 * @returns 小数点以下2桁で切り捨てた単曲レーティングの0.01単位整数値。
 */
export const calculateSingleRatingHundredths = (score: number, chartConstant: number): number => {
  const chartConstantTenths = Math.round(chartConstant * CHART_CONSTANT_SCALE)
  const baseRating = chartConstantTenths * CHART_CONSTANT_SCALE
  let rating = 0

  if (score >= 1_009_000) {
    rating = baseRating + THEORETICAL_RATING_BONUS_HUNDREDTHS
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
