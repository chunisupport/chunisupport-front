import type { ChartDTO, SongDTO } from '../types/api'
import { THEORETICAL_RATING_BONUS_HUNDREDTHS, toRatingHundredths } from './singleRating'

const RATING_SCALE = 100
const PLAYER_RATING_SCALE = 10_000

type TheoreticalChartRating = {
  ratingHundredths: number
  isConstUnknown: boolean
}

/** 新曲枠の理論レーティング計算結果。 */
export type NewSongTheoreticalRating = {
  /** 規定枠数で平均した新曲枠レーティング理論値。 */
  rating: number
  /** 採用譜面に推定譜面定数が含まれるか。 */
  hasUnknownChartConstants: boolean
}

/**
 * 譜面定数から理論スコア時の単曲レーティングを組み立てる。
 *
 * @param chart - 理論値を算出する譜面。
 * @returns 0.01単位の理論単曲レーティングと譜面定数の確定状態。
 */
const buildTheoreticalChartRating = (chart: ChartDTO): TheoreticalChartRating => ({
  ratingHundredths: toRatingHundredths(chart.const) + THEORETICAL_RATING_BONUS_HUNDREDTHS,
  isConstUnknown: chart.is_const_unknown,
})

/**
 * 全新曲の譜面から新曲枠レーティング理論値を算出する。
 *
 * @param songs - 新曲判定と譜面定数を含む通常楽曲一覧。
 * @param slotCount - 新曲枠の規定枠数。
 * @returns 上位譜面を規定枠数で平均した理論値。新曲譜面がなければ未定義。
 */
export const calculateNewSongTheoreticalRating = (
  songs: readonly Pick<SongDTO, 'is_new' | 'charts'>[],
  slotCount: number
): NewSongTheoreticalRating | undefined => {
  const theoreticalRatings = songs
    .filter((song) => song.is_new)
    .flatMap((song) => Object.values(song.charts).map(buildTheoreticalChartRating))
    .sort((left, right) => right.ratingHundredths - left.ratingHundredths)
    .slice(0, slotCount)

  if (theoreticalRatings.length === 0) return undefined

  const totalRatingHundredths = theoreticalRatings.reduce(
    (total, chart) => total + chart.ratingHundredths,
    0
  )
  const theoreticalRatingUnits = Math.round(
    (totalRatingHundredths * PLAYER_RATING_SCALE) / RATING_SCALE / slotCount
  )

  return {
    rating: theoreticalRatingUnits / PLAYER_RATING_SCALE,
    hasUnknownChartConstants: theoreticalRatings.some((chart) => chart.isConstUnknown),
  }
}

/**
 * 新曲枠レーティング理論値と現在値の差を小数点以下4桁単位で算出する。
 *
 * @param theoreticalRating - 新曲枠レーティング理論値。
 * @param currentRating - 現在の新曲枠レーティング。未計算の場合はnull。
 * @returns 理論値から現在値を引いた差。現在値が未計算の場合は未定義。
 */
export const calculateNewSongTheoreticalRatingGap = (
  theoreticalRating: number,
  currentRating: number | null
): number | undefined => {
  if (currentRating === null) return undefined

  const theoreticalUnits = Math.round(theoreticalRating * PLAYER_RATING_SCALE)
  const currentUnits = Math.round(currentRating * PLAYER_RATING_SCALE)
  return (theoreticalUnits - currentUnits) / PLAYER_RATING_SCALE
}
