import type { RatingBandDTO } from '../../../../types/api.ts'

const ALL_RATING_BAND_LABEL = 'ALL'

/**
 * レーティング帯の境界値に指定レーティングが含まれるか判定する。
 *
 * @param value - 判定対象のベスト枠平均レーティング。
 * @param band - 境界値を持つレーティング帯。
 * @returns レーティング帯に含まれる場合は true。
 */
const isRatingInBandRange = (value: number, band: RatingBandDTO): boolean => {
  const isAboveMin = band.min_inclusive === null || value >= band.min_inclusive
  const isBelowMax = band.max_exclusive === null || value < band.max_exclusive

  return isAboveMin && isBelowMax
}

/**
 * 楽曲統計行がログインユーザーのベスト枠平均レート帯に該当するか判定する。
 *
 * @param ratingBandLabel - 統計行のレーティング帯ラベル。
 * @param bestAverage - ログインユーザーのベスト枠平均レーティング。
 * @param ratingBands - マスターデータのレーティング帯定義。
 * @returns ALL以外でベスト枠平均の属する帯なら true。
 */
export const isOwnBestAverageRatingBand = (
  ratingBandLabel: string,
  bestAverage: number | null | undefined,
  ratingBands: RatingBandDTO[] | undefined
): boolean => {
  if (
    ratingBandLabel === ALL_RATING_BAND_LABEL ||
    bestAverage === null ||
    bestAverage === undefined
  ) {
    return false
  }

  const ratingBand = ratingBands?.find((band) => band.label === ratingBandLabel)

  return ratingBand ? isRatingInBandRange(bestAverage, ratingBand) : false
}
