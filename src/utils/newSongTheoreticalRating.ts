import { PLAYER_DATA_DIFFICULTIES } from '../constants/difficulty'
import type { ChartDTO, PlayerDataDifficulty, SongDTO } from '../types/api'
import { THEORETICAL_RATING_BONUS_HUNDREDTHS, toRatingHundredths } from './singleRating'

const RATING_SCALE = 100
const PLAYER_RATING_SCALE = 10_000

type TheoreticalChartRating = NewSongTheoreticalRatingEntry & {
  ratingHundredths: number
}

/** 新曲枠レーティング理論値へ採用された譜面。 */
export type NewSongTheoreticalRatingEntry = {
  /** 楽曲詳細への遷移に使う楽曲ID。 */
  songId: string
  /** 楽曲名。 */
  title: string
  /** アーティスト名。 */
  artist: string
  /** 譜面難易度。 */
  difficulty: PlayerDataDifficulty
  /** 譜面定数。 */
  chartConstant: number
  /** 譜面定数が推定値か。 */
  isChartConstantUnknown: boolean
  /** 理論スコア時の単曲レーティング。 */
  rating: number
}

/** 新曲枠の理論レーティング計算結果。 */
export type NewSongTheoreticalRating = {
  /** 規定枠数で平均した新曲枠レーティング理論値。 */
  rating: number
  /** 採用譜面に推定譜面定数が含まれるか。 */
  hasUnknownChartConstants: boolean
  /** 理論値へ採用された単曲レーティング降順の譜面一覧。 */
  entries: NewSongTheoreticalRatingEntry[]
}

/**
 * 譜面定数から理論スコア時の単曲レーティングを組み立てる。
 *
 * @param song - 理論値を算出する譜面の楽曲情報。
 * @param difficulty - 理論値を算出する難易度。
 * @param chart - 理論値を算出する譜面。
 * @returns 表示用楽曲情報を含む理論単曲レーティング。
 */
const buildTheoreticalChartRating = (
  song: Pick<SongDTO, 'id' | 'title' | 'artist'>,
  difficulty: PlayerDataDifficulty,
  chart: ChartDTO
): TheoreticalChartRating => {
  const ratingHundredths = toRatingHundredths(chart.const) + THEORETICAL_RATING_BONUS_HUNDREDTHS

  return {
    songId: song.id,
    title: song.title,
    artist: song.artist,
    difficulty,
    chartConstant: chart.const,
    isChartConstantUnknown: chart.is_const_unknown,
    rating: ratingHundredths / RATING_SCALE,
    ratingHundredths,
  }
}

/**
 * 理論単曲レーティング降順で比較し、同率時は楽曲IDと難易度順で順序を固定する。
 *
 * @param left - 比較する左側の譜面。
 * @param right - 比較する右側の譜面。
 * @returns 左側を先に並べる場合は負数、右側を先に並べる場合は正数、同一なら0。
 */
const compareTheoreticalChartRating = (
  left: TheoreticalChartRating,
  right: TheoreticalChartRating
): number => {
  const ratingDifference = right.ratingHundredths - left.ratingHundredths
  if (ratingDifference !== 0) return ratingDifference

  const songIdDifference = left.songId.localeCompare(right.songId)
  if (songIdDifference !== 0) return songIdDifference

  return (
    PLAYER_DATA_DIFFICULTIES.indexOf(left.difficulty) -
    PLAYER_DATA_DIFFICULTIES.indexOf(right.difficulty)
  )
}

/**
 * 全新曲の譜面から新曲枠レーティング理論値を算出する。
 *
 * @param songs - 新曲判定と譜面定数を含む通常楽曲一覧。
 * @param slotCount - 新曲枠の規定枠数。
 * @returns 上位譜面を規定枠数で平均した理論値。新曲譜面がなければ未定義。
 */
export const calculateNewSongTheoreticalRating = (
  songs: readonly Pick<SongDTO, 'id' | 'title' | 'artist' | 'is_new' | 'charts'>[],
  slotCount: number
): NewSongTheoreticalRating | undefined => {
  const theoreticalRatings = songs
    .filter((song) => song.is_new)
    .flatMap((song) =>
      PLAYER_DATA_DIFFICULTIES.flatMap((difficulty) => {
        const chart = song.charts[difficulty]
        return chart ? [buildTheoreticalChartRating(song, difficulty, chart)] : []
      })
    )
    .sort(compareTheoreticalChartRating)
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
    hasUnknownChartConstants: theoreticalRatings.some((chart) => chart.isChartConstantUnknown),
    entries: theoreticalRatings.map(({ ratingHundredths: _ratingHundredths, ...entry }) => entry),
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
