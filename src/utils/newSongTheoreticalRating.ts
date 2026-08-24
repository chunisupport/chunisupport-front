import { PLAYER_DATA_DIFFICULTIES } from '../constants/difficulty'
import type {
  ChartDTO,
  PlayerDataDifficulty,
  PlayerRecordDTO,
  SongDTO,
  VersionDTO,
} from '../types/api'
import { SCORE_RANK_MIN_SCORES } from './scoreRank'
import { calculateSingleRatingHundredths, MAX_RATING_SCORE } from './singleRating'

const RATING_SCALE = 100
const PLAYER_RATING_SCALE = 10_000

/** 枠理論値の集計中に使用する、表示用譜面情報と整数化した単曲レーティング */
type TheoreticalChartRating = RatingTheoreticalEntry & {
  /** 浮動小数点誤差を避けて並べ替え・合計するための100倍単曲レーティング */
  ratingHundredths: number
}

/** レーティング枠の理論値へ採用された譜面 */
export type RatingTheoreticalEntry = {
  /** 楽曲詳細への遷移に使う楽曲ID */
  songId: string
  /** 楽曲名 */
  title: string
  /** アーティスト名 */
  artist: string
  /** 譜面難易度 */
  difficulty: PlayerDataDifficulty
  /** 譜面定数 */
  chartConstant: number
  /** 譜面定数が推定値か */
  isChartConstantUnknown: boolean
  /** 理論スコア時の単曲レーティング */
  rating: number
}

/** レーティング枠の理論値計算結果 */
export type RatingTheoretical = {
  /** 規定枠数までの採用譜面数で平均したレーティング理論値 */
  rating: number
  /** 採用譜面に推定譜面定数が含まれるか */
  hasUnknownChartConstants: boolean
  /** 理論値へ採用された単曲レーティング降順の譜面一覧 */
  entries: RatingTheoreticalEntry[]
}

/** 理論値対象譜面に対応する現在レコードの所属 */
export type RatingTheoreticalProgressSlot = 'current' | 'candidate'

/** SSS+対象譜面の現在スコアとSSS+ボーダーとの差 */
export type RatingTheoreticalProgress = {
  /** 現在スコアを取得した枠。レコードがなければnull */
  slot: RatingTheoreticalProgressSlot | null
  /** 現在スコア。レコードがなければnull */
  currentScore: number | null
  /** 現在スコアからSSS+ボーダーを引いた不足差。到達済みまたはレコードなしならnull */
  scoreGap: number | null
}

type RatingRecord = Pick<PlayerRecordDTO, 'id' | 'difficulty' | 'score'>

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
  const ratingHundredths = calculateSingleRatingHundredths(MAX_RATING_SCORE, chart.const)

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
 * バージョン一覧から基準日時点の現行バージョン稼働開始日を返す。
 *
 * @param versions - 稼働開始日を持つバージョン一覧。
 * @param referenceDate - 現行判定に使うYYYY-MM-DD形式の基準日。
 * @returns 基準日以前で最新のYYYY-MM-DD形式の稼働開始日。対象がなければ未定義。
 */
const resolveCurrentVersionReleaseDate = (
  versions: readonly Pick<VersionDTO, 'released_at'>[],
  referenceDate: string
): string | undefined =>
  versions.reduce<string | undefined>((latestReleaseDate, version) => {
    const releaseDate = version.released_at.slice(0, 10)
    if (releaseDate > referenceDate) return latestReleaseDate
    return latestReleaseDate === undefined || releaseDate > latestReleaseDate
      ? releaseDate
      : latestReleaseDate
  }, undefined)

/**
 * 楽曲IDと難易度が理論値対象譜面に一致するレコードを返す。
 *
 * @param entry - 理論値対象の楽曲IDと難易度。
 * @param records - 検索対象のレコード一覧。
 * @returns 一致する先頭レコード。存在しなければ未定義。
 */
const findTheoreticalChartRecord = (
  entry: Pick<RatingTheoreticalEntry, 'songId' | 'difficulty'>,
  records: readonly RatingRecord[]
): RatingRecord | undefined =>
  records.find((record) => record.id === entry.songId && record.difficulty === entry.difficulty)

/**
 * 対象楽曲の全譜面から規定枠数分のレーティング理論値を算出する。
 *
 * @param songs - 理論値計算の対象楽曲一覧。
 * @param slotCount - 採用するレーティング枠数。
 * @returns 上位譜面を採用譜面数で平均した理論値。対象譜面がなければ未定義。
 */
const calculateTheoreticalRating = (
  songs: readonly Pick<SongDTO, 'id' | 'title' | 'artist' | 'charts'>[],
  slotCount: number
): RatingTheoretical | undefined => {
  const theoreticalRatings = songs
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
    (totalRatingHundredths * PLAYER_RATING_SCALE) / RATING_SCALE / theoreticalRatings.length
  )

  return {
    rating: theoreticalRatingUnits / PLAYER_RATING_SCALE,
    hasUnknownChartConstants: theoreticalRatings.some((chart) => chart.isChartConstantUnknown),
    entries: theoreticalRatings.map(({ ratingHundredths: _ratingHundredths, ...entry }) => entry),
  }
}

/**
 * 配信済みの全通常楽曲からベスト枠レーティング理論値を算出する。
 *
 * @param songs - リリース日と譜面定数を含む通常楽曲一覧。
 * @param referenceDate - 配信済み楽曲を判定するYYYY-MM-DD形式の基準日。
 * @param slotCount - ベスト枠の規定枠数。
 * @returns 規定枠数までの上位譜面を採用譜面数で平均した理論値。
 */
export const calculateBestTheoreticalRating = (
  songs: readonly Pick<SongDTO, 'id' | 'title' | 'artist' | 'release' | 'charts'>[],
  referenceDate: string,
  slotCount: number
): RatingTheoretical | undefined =>
  calculateTheoreticalRating(
    songs.filter((song) => song.release === null || song.release.slice(0, 10) <= referenceDate),
    slotCount
  )

/**
 * 全新曲の譜面から新曲枠レーティング理論値を算出する。
 *
 * @param songs - リリース日と譜面定数を含む通常楽曲一覧。
 * @param versions - 新曲枠対象の開始日を解決するバージョン一覧。
 * @param referenceDate - 現行バージョンと配信済み楽曲を判定する基準日。
 * @param slotCount - 新曲枠の規定枠数。
 * @returns 規定枠数までの上位譜面を採用譜面数で平均した理論値。新曲譜面がなければ未定義。
 */
export const calculateNewSongTheoreticalRating = (
  songs: readonly Pick<SongDTO, 'id' | 'title' | 'artist' | 'release' | 'charts'>[],
  versions: readonly Pick<VersionDTO, 'released_at'>[],
  referenceDate: string,
  slotCount: number
): RatingTheoretical | undefined => {
  const currentVersionReleaseDate = resolveCurrentVersionReleaseDate(versions, referenceDate)
  if (currentVersionReleaseDate === undefined) return undefined

  return calculateTheoreticalRating(
    songs.filter(
      (song) =>
        song.release !== null &&
        song.release.slice(0, 10) >= currentVersionReleaseDate &&
        song.release.slice(0, 10) <= referenceDate
    ),
    slotCount
  )
}

/**
 * 理論値対象譜面に対応する現在のレーティング枠・候補枠レコードを解決する。
 *
 * @param entry - 理論値対象の楽曲IDと難易度。
 * @param currentRecords - 現在のレーティング枠レコード。
 * @param candidateRecords - 現在の候補枠レコード。
 * @returns 現在スコア、SSS+ボーダーとの差、レコードの所属枠。
 */
export const resolveRatingTheoreticalProgress = (
  entry: Pick<RatingTheoreticalEntry, 'songId' | 'difficulty'>,
  currentRecords: readonly RatingRecord[],
  candidateRecords: readonly RatingRecord[]
): RatingTheoreticalProgress => {
  const currentRecord = findTheoreticalChartRecord(entry, currentRecords)
  const candidateRecord = findTheoreticalChartRecord(entry, candidateRecords)
  const record = currentRecord ?? candidateRecord

  if (!record) {
    return { slot: null, currentScore: null, scoreGap: null }
  }

  return {
    slot: currentRecord ? 'current' : 'candidate',
    currentScore: record.score,
    scoreGap:
      record.score < SCORE_RANK_MIN_SCORES['SSS+']
        ? record.score - SCORE_RANK_MIN_SCORES['SSS+']
        : null,
  }
}

/**
 * レーティング枠理論値と現在値の差を小数点以下4桁単位で算出する。
 *
 * @param theoreticalRating - レーティング枠理論値。
 * @param currentRating - 現在のレーティング枠平均。未計算の場合はnull。
 * @returns 理論値から現在値を引いた差。現在値が未計算の場合は未定義。
 */
export const calculateRatingTheoreticalGap = (
  theoreticalRating: number,
  currentRating: number | null
): number | undefined => {
  if (currentRating === null) return undefined

  const theoreticalUnits = Math.round(theoreticalRating * PLAYER_RATING_SCALE)
  const currentUnits = Math.round(currentRating * PLAYER_RATING_SCALE)
  return (theoreticalUnits - currentUnits) / PLAYER_RATING_SCALE
}
