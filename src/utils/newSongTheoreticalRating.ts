import { SCORE_THEORETICAL_MAX } from '../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../constants/difficulty'
import type {
  ChartDTO,
  PlayerDataDifficulty,
  PlayerRecordDTO,
  SongDTO,
  VersionDTO,
} from '../types/api'
import { calculateSingleRatingHundredths, MAX_RATING_SCORE } from './singleRating'

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
  /** 規定枠数までの採用譜面数で平均した新曲枠レーティング理論値。 */
  rating: number
  /** 採用譜面に推定譜面定数が含まれるか。 */
  hasUnknownChartConstants: boolean
  /** 理論値へ採用された単曲レーティング降順の譜面一覧。 */
  entries: NewSongTheoreticalRatingEntry[]
}

/** 理論値対象譜面に対応する現在レコードの所属。 */
export type NewSongTheoreticalRatingProgressSlot = 'new' | 'new_candidate'

/** 理論値対象譜面の現在スコアと理論スコアまでの差。 */
export type NewSongTheoreticalRatingProgress = {
  /** 現在スコアを取得した枠。レコードがなければnull。 */
  slot: NewSongTheoreticalRatingProgressSlot | null
  /** 現在スコア。レコードがなければnull。 */
  currentScore: number | null
  /** CHUNITHM理論スコアまでに必要なスコア差。レコードがなければnull。 */
  scoreGap: number | null
}

type NewSongRatingRecord = Pick<PlayerRecordDTO, 'id' | 'difficulty' | 'score'>

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
  entry: Pick<NewSongTheoreticalRatingEntry, 'songId' | 'difficulty'>,
  records: readonly NewSongRatingRecord[]
): NewSongRatingRecord | undefined =>
  records.find((record) => record.id === entry.songId && record.difficulty === entry.difficulty)

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
): NewSongTheoreticalRating | undefined => {
  const currentVersionReleaseDate = resolveCurrentVersionReleaseDate(versions, referenceDate)
  if (currentVersionReleaseDate === undefined) return undefined

  const theoreticalRatings = songs
    .filter(
      (song) =>
        song.release !== null &&
        song.release.slice(0, 10) >= currentVersionReleaseDate &&
        song.release.slice(0, 10) <= referenceDate
    )
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
 * 理論値対象譜面に対応する現在の新曲枠・候補枠レコードを解決する。
 *
 * @param entry - 理論値対象の楽曲IDと難易度。
 * @param currentRecords - 現在の新曲枠レコード。
 * @param candidateRecords - 現在の新曲候補枠レコード。
 * @returns 現在スコア、理論スコアまでの差、レコードの所属枠。
 */
export const resolveNewSongTheoreticalRatingProgress = (
  entry: Pick<NewSongTheoreticalRatingEntry, 'songId' | 'difficulty'>,
  currentRecords: readonly NewSongRatingRecord[],
  candidateRecords: readonly NewSongRatingRecord[]
): NewSongTheoreticalRatingProgress => {
  const currentRecord = findTheoreticalChartRecord(entry, currentRecords)
  const candidateRecord = findTheoreticalChartRecord(entry, candidateRecords)
  const record = currentRecord ?? candidateRecord

  if (!record) {
    return { slot: null, currentScore: null, scoreGap: null }
  }

  return {
    slot: currentRecord ? 'new' : 'new_candidate',
    currentScore: record.score,
    scoreGap: SCORE_THEORETICAL_MAX - record.score,
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
