export { courseClassBadgeClass, formatCourseClass } from '../../utils/courseClassDisplay'

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
