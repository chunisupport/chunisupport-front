import type { CourseTrackSelectionType } from '../types/api'
import { toChartLevelLabel } from '../utils/chartLevel'
import { COURSE_TRACK_COUNT } from '../utils/courseScoreRank'
import { CHART_CONST_MAX, CHART_CONST_MIN } from './chart'

/** 固定位置として描画する3枠のトラック番号。 */
export const COURSE_TRACK_NUMBERS = Array.from(
  { length: COURSE_TRACK_COUNT },
  (_, index) => index + 1
)

/** 選曲方式の表示名。ランダム枠は CHUNITHM-NET の表記に合わせて区別しない。 */
export const COURSE_TRACK_SELECTION_LABELS: Record<CourseTrackSelectionType, string> = {
  FIXED: '固定',
  RANDOM_FILTER: 'RANDOM',
  RANDOM_POOL: 'RANDOM',
}

/** コースAPIで指定できる表示レベルの全境界。 */
export const COURSE_TRACK_LEVELS = Array.from(
  { length: (CHART_CONST_MAX - CHART_CONST_MIN) * 2 + 1 },
  (_, index) => toChartLevelLabel(CHART_CONST_MIN + index / 2)
)
