import type { CourseStatsBandDTO, RatingBandDTO } from '../types/api'
import { calculateChartStatsPercent } from './chartStats'
import { COURSE_TRACK_COUNT } from './courseScoreRank'
import { MAX_SCORE } from './scoreRank'

/** コースモードの理論値スコア（3曲合計） */
export const COURSE_MAX_SCORE = MAX_SCORE * COURSE_TRACK_COUNT

/**
 * プレイヤーが存在しないレーティング帯のコース統計行を生成する。
 *
 * @param ratingBand - 統計行へ設定するレーティング帯ラベル。
 * @returns 全集計値が0のコース統計行。
 */
const createEmptyCourseStatsBand = (ratingBand: string): CourseStatsBandDTO => ({
  rating_band: ratingBand,
  combo: {
    none: 0,
    fc: 0,
    aj: 0,
  },
  clear: {
    failed: 0,
    clear: 0,
  },
  average_score: null,
  median_score: null,
  player_count: 0,
})

/**
 * マスター定義に従い、欠落したレーティング帯を0人のコース統計行で補完する。
 *
 * @param stats - APIから取得したレーティング帯別コース統計。
 * @param ratingBands - 表示対象となるレーティング帯のマスター定義。
 * @returns sort_order順ですべてのレーティング帯を含むコース統計行。
 */
export const completeCourseStatsRatingBands = (
  stats: readonly CourseStatsBandDTO[],
  ratingBands: readonly RatingBandDTO[]
): CourseStatsBandDTO[] => {
  const statsByRatingBand = new Map(stats.map((band) => [band.rating_band, band]))

  return [...ratingBands]
    .sort((left, right) => left.sort_order - right.sort_order)
    .map(
      (ratingBand) =>
        statsByRatingBand.get(ratingBand.label) ?? createEmptyCourseStatsBand(ratingBand.label)
    )
}

/**
 * 人数をプレイ人数に対する割合として表示用に整形する。
 *
 * @param count - 対象の人数。
 * @param playerCount - 母数となるプレイ人数。
 * @returns 小数1桁のパーセント表記。プレイ人数が0の場合はハイフン。
 */
export const formatCourseStatsRate = (count: number, playerCount: number): string => {
  const percent = calculateChartStatsPercent(count, playerCount)
  return percent === null ? '-' : `${percent.toFixed(1)}%`
}

/**
 * 3曲合計のコーススコアから1曲あたりの平均スコア（整数切り捨て）を算出する。
 *
 * @param score - 3曲合計のコーススコア。
 * @returns 1曲あたりの平均スコア。
 */
export const calculateCoursePerTrackAverageScore = (score: number): number =>
  Math.trunc(score / COURSE_TRACK_COUNT)
