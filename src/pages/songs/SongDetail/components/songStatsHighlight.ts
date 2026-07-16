import type { RatingBandDTO } from '../../../../types/api'
import { ALL_RATING_BAND_LABEL, findRatingBandForValue } from '../../../../utils/ratingBand'

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

  return findRatingBandForValue(ratingBands ?? [], bestAverage)?.label === ratingBandLabel
}
