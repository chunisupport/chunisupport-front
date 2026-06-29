import type { RatingBandDTO, SongStatsBandDTO } from '../types/api'

/**
 * 自分のスコアと全プレイヤーの平均スコアとの差分を算出する。
 *
 * @param ownScore - ログインユーザーの譜面スコア。未プレイの場合は未定義。
 * @param averageScore - 全プレイヤーの平均スコア。集計対象がない場合はnull。
 * @returns 両方のスコアが存在する場合は自分のスコアから平均スコアを引いた値、それ以外は未定義。
 */
export const calculateOwnScoreDifference = (
  ownScore: number | undefined,
  averageScore: number | null
): number | undefined =>
  ownScore === undefined || averageScore === null ? undefined : ownScore - averageScore

/**
 * プレイヤーが存在しないレーティング帯の統計行を生成する。
 *
 * @param ratingBand - 統計行へ設定するレーティング帯ラベル。
 * @returns 全集計値が0の統計行。
 */
const createEmptySongStatsBand = (ratingBand: string): SongStatsBandDTO => ({
  rating_band: ratingBand,
  rank: {
    aaal: 0,
    s: 0,
    sp: 0,
    ss: 0,
    ssp: 0,
    sss: 0,
    sssp: 0,
    max: 0,
  },
  combo: {
    none: 0,
    fc: 0,
    aj: 0,
    ajc: 0,
  },
  clear: {
    failed: 0,
    clear: 0,
    hard: 0,
    brave: 0,
    absolute: 0,
    catastrophy: 0,
  },
  average_score: null,
  player_count: 0,
})

/**
 * マスター定義に従い、欠落したレーティング帯を0人の統計行で補完する。
 *
 * @param stats - APIから取得したレーティング帯別統計。
 * @param ratingBands - 表示対象となるレーティング帯のマスター定義。
 * @returns sort_order順ですべてのレーティング帯を含む統計行。
 */
export const completeSongStatsRatingBands = (
  stats: SongStatsBandDTO[],
  ratingBands: RatingBandDTO[]
): SongStatsBandDTO[] => {
  const statsByRatingBand = new Map(stats.map((band) => [band.rating_band, band]))

  return [...ratingBands]
    .sort((left, right) => left.sort_order - right.sort_order)
    .map(
      (ratingBand) =>
        statsByRatingBand.get(ratingBand.label) ?? createEmptySongStatsBand(ratingBand.label)
    )
}
