import { PLAYER_DATA_DIFFICULTIES } from '../constants/difficulty'
import { ALL_SONG_BEST_SLOT_COUNT } from '../constants/rating'
import type { PlayerDataDifficulty, PlayerRecordDTO } from '../types/api'
import { toRatingHundredths } from './singleRating'

const RATING_SCALE = 100
const PLAYER_RATING_SCALE = 10_000

/** 全曲ベスト枠の平均と順位付きレコード */
export type AllSongBestFrame = {
  /** 上位30曲の平均レーティング。対象がなければnull */
  primaryAverage: number | null
  /** 上位50曲の平均レーティング。対象がなければnull */
  totalAverage: number | null
  /** 上位30曲に未確定譜面定数が含まれるか */
  primaryHasUnknownChartConstants: boolean
  /** 上位50曲に未確定譜面定数が含まれるか */
  totalHasUnknownChartConstants: boolean
  /** 単曲レーティング順の1〜30位 */
  primaryRecords: PlayerRecordDTO[]
  /** 単曲レーティング順の31〜50位 */
  remainingRecords: PlayerRecordDTO[]
}

/**
 * 単曲レーティング降順で比較し、同率時は楽曲IDと難易度順で順序を固定する。
 *
 * @param left - 比較する左側のレコード。
 * @param right - 比較する右側のレコード。
 * @returns 左側を先に並べる場合は負数、右側を先に並べる場合は正数、同一なら0。
 */
const compareAllSongBestRecords = (left: PlayerRecordDTO, right: PlayerRecordDTO): number => {
  const ratingDifference = toRatingHundredths(right.rating) - toRatingHundredths(left.rating)
  if (ratingDifference !== 0) return ratingDifference

  const songIdDifference = left.id.localeCompare(right.id)
  if (songIdDifference !== 0) return songIdDifference

  return (
    PLAYER_DATA_DIFFICULTIES.indexOf(left.difficulty.toUpperCase() as PlayerDataDifficulty) -
    PLAYER_DATA_DIFFICULTIES.indexOf(right.difficulty.toUpperCase() as PlayerDataDifficulty)
  )
}

/**
 * 単曲レーティングの平均をプレイヤーレーティングと同じ0.0001単位へ丸める。
 *
 * @param records - 平均対象のレコード。
 * @returns 対象件数で平均したレーティング。対象がなければnull。
 */
const calculateRatingAverage = (records: readonly PlayerRecordDTO[]): number | null => {
  if (records.length === 0) return null

  const totalRatingHundredths = records.reduce(
    (total, record) => total + toRatingHundredths(record.rating),
    0
  )
  const averageUnits = Math.round(
    (totalRatingHundredths * PLAYER_RATING_SCALE) / RATING_SCALE / records.length
  )
  return averageUnits / PLAYER_RATING_SCALE
}

/**
 * 対象レコードに未確定の譜面定数が含まれるか判定する。
 *
 * @param records - 判定対象のレコード。
 * @returns 未確定譜面定数を含む場合はtrue。
 */
const hasUnknownChartConstants = (records: readonly PlayerRecordDTO[]): boolean =>
  records.some((record) => record.is_const_unknown)

/**
 * 全通常譜面からベスト枠・新曲枠を区別せず、単曲レーティング上位50曲を組み立てる。
 *
 * @param records - 未プレイを含む通常譜面レコード。
 * @returns 30曲平均・50曲平均と、1〜30位および31〜50位のレコード。
 */
export const buildAllSongBestFrame = (records: readonly PlayerRecordDTO[]): AllSongBestFrame => {
  const rankedRecords = records
    .filter((record) => record.is_played)
    .sort(compareAllSongBestRecords)
    .slice(0, ALL_SONG_BEST_SLOT_COUNT.total)

  const primaryRecords = rankedRecords.slice(0, ALL_SONG_BEST_SLOT_COUNT.primary)
  const remainingRecords = rankedRecords.slice(ALL_SONG_BEST_SLOT_COUNT.primary)

  return {
    primaryAverage: calculateRatingAverage(primaryRecords),
    totalAverage: calculateRatingAverage(rankedRecords),
    primaryHasUnknownChartConstants: hasUnknownChartConstants(primaryRecords),
    totalHasUnknownChartConstants: hasUnknownChartConstants(rankedRecords),
    primaryRecords,
    remainingRecords,
  }
}
