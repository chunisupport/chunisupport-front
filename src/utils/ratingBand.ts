import type { RatingBandDTO } from '../types/api'

/** 全プレイヤーを表す特殊なレート帯ラベル。 */
export const ALL_RATING_BAND_LABEL = 'ALL'

/**
 * 指定値を含むベスト枠平均レート帯を取得する。
 *
 * @param ratingBands - レート帯マスター一覧。
 * @param value - 判定対象のベスト枠平均レーティング。
 * @returns 値を含むレート帯。該当しない場合は undefined。
 */
export const findRatingBandForValue = (
  ratingBands: readonly RatingBandDTO[],
  value: number
): RatingBandDTO | undefined =>
  ratingBands.find(
    (band) =>
      band.label !== ALL_RATING_BAND_LABEL &&
      (band.min_inclusive === null || value >= band.min_inclusive) &&
      (band.max_exclusive === null || value < band.max_exclusive)
  )

/**
 * ランキングで選択可能な最上位レート帯を取得する。
 *
 * @param ratingBands - レート帯マスター一覧。
 * @returns sort_order が最大の通常レート帯。存在しない場合は undefined。
 */
export const getHighestRatingBand = (
  ratingBands: readonly RatingBandDTO[]
): RatingBandDTO | undefined =>
  ratingBands
    .filter((band) => band.label !== ALL_RATING_BAND_LABEL)
    .reduce<RatingBandDTO | undefined>(
      (highest, band) => (!highest || band.sort_order > highest.sort_order ? band : highest),
      undefined
    )

/**
 * 認証状態に応じたベスト枠ランキングの初期レート帯を解決する。
 *
 * @param ratingBands - レート帯マスター一覧。
 * @param bestAverage - ログインユーザーのベスト枠平均。未ログイン時は null。
 * @returns ユーザー該当帯。未該当時は最上位帯。
 */
export const resolveInitialBestSlotRatingBand = (
  ratingBands: readonly RatingBandDTO[],
  bestAverage: number | null | undefined
): RatingBandDTO | undefined =>
  bestAverage === null || bestAverage === undefined
    ? getHighestRatingBand(ratingBands)
    : (findRatingBandForValue(ratingBands, bestAverage) ?? getHighestRatingBand(ratingBands))
