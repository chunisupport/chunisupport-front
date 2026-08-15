export { courseClassBadgeClass, formatCourseClass } from '../../utils/courseClassDisplay'

/** 楽曲またはコース名を解決できない場合の表示名。 */
export const REGISTER_SCORE_UNKNOWN_TITLE = '-'

/**
 * WORLD'S ENDの星数レベルをレポート表示用の文字列へ変換する。
 *
 * @param levelStar - WORLD'S END譜面の星数レベル。
 * @returns 星を付けたレベル。未設定の場合はundefined。
 */
export const formatWorldsendChartLevel = (
  levelStar: number | null | undefined
): string | undefined =>
  levelStar === null || levelStar === undefined ? undefined : `★${levelStar}`
