import type {
  CourseDTO,
  PlayerDataCourseRecordChange,
  PlayerDataRecordChange,
  PlayerDataRecordState,
  PlayerDataSongRecordChange,
  SongDTO,
  WorldsendSongDTO,
} from '../../types/api'
import { getChartLevelSortKey, toChartLevelLabel } from '../../utils/chartLevel'
import { calculateSingleOverPower } from '../../utils/singleOverPower'
import { calculateSingleRatingHundredths } from '../../utils/singleRating'
import { formatWorldsendChartLevel, REGISTER_SCORE_UNKNOWN_TITLE } from './registerScoreDisplay'
import type { RegisterScoreSongSortValues } from './registerScoreSorting'

/**
 * 更新差分に含まれる楽曲の表示名を解決する。
 *
 * @param change - APIが返した1譜面分の差分。
 * @param standardSongs - 通常楽曲マスタ。
 * @param worldsendSongs - WORLD'S END楽曲マスタ。
 * @returns 楽曲名。マスタに存在しない場合はプレースホルダー。
 */
export const resolveRegisterScoreSongTitle = (
  change: PlayerDataRecordChange,
  standardSongs: SongDTO[],
  worldsendSongs: WorldsendSongDTO[]
): string => {
  if (change.record_type === 'course') {
    return REGISTER_SCORE_UNKNOWN_TITLE
  }

  const songs = change.record_type === 'worldsend' ? worldsendSongs : standardSongs
  return (
    songs.find((song) => song.official_idx === change.idx)?.title ?? REGISTER_SCORE_UNKNOWN_TITLE
  )
}

/**
 * 更新差分に含まれる譜面のレベル表記を解決する。
 *
 * @param change - APIが返した1譜面分の差分。
 * @param standardSongs - 通常楽曲マスタ。
 * @param worldsendSongs - WORLD'S END楽曲マスタ。
 * @returns 通常譜面レベルまたはWORLD'S ENDの星表記。解決できない場合はundefined。
 */
export const resolveRegisterScoreChartLevel = (
  change: PlayerDataRecordChange,
  standardSongs: SongDTO[],
  worldsendSongs: WorldsendSongDTO[]
): string | undefined => {
  if (change.record_type === 'worldsend') {
    const song = worldsendSongs.find((item) => item.official_idx === change.idx)
    return formatWorldsendChartLevel(song?.charts.WORLDSEND?.level_star)
  }

  if (change.record_type !== 'standard' || change.diff === 'WE') {
    return undefined
  }

  const song = standardSongs.find((item) => item.official_idx === change.idx)
  const chart = song?.charts?.[change.diff]
  return chart ? toChartLevelLabel(chart.const) : undefined
}

/**
 * 更新差分のソートに使うレベルと単曲レーティングを解決する。
 *
 * @param change - APIが返した1譜面分の楽曲差分。
 * @param standardSongs - 通常楽曲マスタ。
 * @returns ソート用のレベルと単曲レーティング。対象外または未解決の場合はnull。
 */
export const resolveRegisterScoreSongSortValues = (
  change: PlayerDataSongRecordChange,
  standardSongs: SongDTO[]
): RegisterScoreSongSortValues => {
  if (change.record_type === 'worldsend' || change.diff === 'WE') {
    return { level: null, singleRating: null }
  }

  const song = standardSongs.find((item) => item.official_idx === change.idx)
  const chart = song?.charts?.[change.diff]
  if (!chart) {
    return { level: null, singleRating: null }
  }

  return {
    level: getChartLevelSortKey(toChartLevelLabel(chart.const)),
    singleRating: calculateSingleRatingHundredths(change.after.score, chart.const),
  }
}

/**
 * 更新差分に含まれるコースの表示名を解決する。
 *
 * @param change - APIが返した1コース分の差分。
 * @param courses - コースマスタ。
 * @returns コース名。マスタに存在しない場合はプレースホルダー。
 */
export const resolveRegisterScoreCourseTitle = (
  change: PlayerDataCourseRecordChange,
  courses: Pick<CourseDTO, 'idx' | 'name'>[]
): string =>
  courses.find((course) => course.idx === change.idx)?.name ?? REGISTER_SCORE_UNKNOWN_TITLE

/** 更新差分カードに表示する単曲レーティングとOVER POWER。 */
export interface RegisterScoreSongMetrics {
  singleRating: number
  overPower: number
  overPowerPercent: number
}

/** 前後の記録がない場合はnullとなる単曲メトリクス。 */
export interface RegisterScoreSongMetricChange {
  before: RegisterScoreSongMetrics | null
  after: RegisterScoreSongMetrics
}

/**
 * 記録のスコアとコンボランプからカード表示用の数値を算出する。
 *
 * @param state - 登録前または登録後の記録。
 * @param chartConstant - 閲覧時の譜面定数。
 * @returns 単曲レーティング、OP値、譜面別OP達成率。
 */
const calculateSongMetrics = (
  state: PlayerDataRecordState,
  chartConstant: number
): RegisterScoreSongMetrics => {
  const overPower = calculateSingleOverPower(state.score, chartConstant, state.combo_lamp)
  return {
    singleRating: calculateSingleRatingHundredths(state.score, chartConstant) / 100,
    overPower: overPower.value,
    overPowerPercent: overPower.percent,
  }
}

/**
 * 閲覧時の通常楽曲マスタで更新前後の単曲メトリクスを解決する。
 *
 * @param change - 通常譜面またはWORLD'S ENDの更新差分。
 * @param standardSongs - 取得済みの通常楽曲マスタ。
 * @returns 更新前後の値。対象外または譜面未取得の場合はnull。
 */
export const resolveRegisterScoreSongMetrics = (
  change: PlayerDataSongRecordChange,
  standardSongs: SongDTO[]
): RegisterScoreSongMetricChange | null => {
  if (change.record_type !== 'standard' || change.diff === 'WE') return null
  const chart = standardSongs.find((song) => song.official_idx === change.idx)?.charts?.[
    change.diff
  ]
  if (!chart) return null
  return {
    before: change.before ? calculateSongMetrics(change.before, chart.const) : null,
    after: calculateSongMetrics(change.after, chart.const),
  }
}
