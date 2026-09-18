import { CHART_CONST_MIN } from '../constants/chart'
import type { PlayerRecordDTO } from '../types/api'
import {
  calculateSingleRatingHundredths,
  MAX_RATING_SCORE,
  THEORETICAL_RATING_BONUS_HUNDREDTHS,
  toRatingHundredths,
} from './singleRating'

const CHART_CONSTANT_TENTHS_SCALE = 10

/**
 * 指定単曲レートへ理論値で到達できる譜面定数の下限を求める。
 *
 * @param rating - 目標とする単曲レート。
 * @returns 0.1刻みへ切り上げた到達可能譜面定数の下限。
 */
export const resolveRatingGoalMinimumChartConstant = (rating: number): number => {
  const requiredBaseHundredths = toRatingHundredths(rating) - THEORETICAL_RATING_BONUS_HUNDREDTHS
  const minimumTenths = Math.ceil(requiredBaseHundredths / CHART_CONSTANT_TENTHS_SCALE)
  return Math.max(CHART_CONST_MIN, minimumTenths / CHART_CONSTANT_TENTHS_SCALE)
}

/**
 * 指定単曲レートへ理論値で到達可能な譜面だけを抽出する。
 *
 * @param records - 目標属性で抽出済みのプレイヤーレコード。
 * @param rating - 目標とする単曲レート。
 * @returns 理論スコア時の単曲レートが目標以上になるレコード。
 */
export const filterRatingReachableRecords = (
  records: PlayerRecordDTO[],
  rating: number
): PlayerRecordDTO[] => {
  const targetHundredths = toRatingHundredths(rating)
  return records.filter(
    (record) =>
      !record.is_const_unknown &&
      calculateSingleRatingHundredths(MAX_RATING_SCORE, record.const) >= targetHundredths
  )
}
