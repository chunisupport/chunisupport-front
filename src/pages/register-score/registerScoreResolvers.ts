import type {
  CourseDTO,
  PlayerDataCourseRecordChange,
  PlayerDataRecordChange,
  SongDTO,
  WorldsendSongDTO,
} from '../../types/api'
import { toChartLevelLabel } from '../../utils/chartLevel'
import { formatWorldsendChartLevel, REGISTER_SCORE_UNKNOWN_TITLE } from './registerScoreDisplay'

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
