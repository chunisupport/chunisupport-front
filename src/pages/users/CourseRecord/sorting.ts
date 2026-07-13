import type { CourseRecordDTO } from '../../../types/api'
import type { SortCondition } from '../../../utils/sortConditions'
import { compareNumberWithUnplayedLast } from '../recordTable/sortComparators'
import { compareComboLamp } from '../utils/lampSorting'
import type { CourseRecordSortKey } from './columns'

/** コースレコード表のソート条件。 */
export type CourseRecordSortCondition = SortCondition<CourseRecordSortKey>

/** コースクラスの表示順。 */
const COURSE_CLASS_ORDER = ['1', '2', '3', '4', '5', 'inf', 'extra'] as const

/** コースクラスごとのソート用番号。 */
const COURSE_CLASS_SORT_VALUE = new Map<string, number>(
  COURSE_CLASS_ORDER.map((courseClass, index) => [courseClass, index])
)

/** コースレコード表の既定ソート条件。 */
export const DEFAULT_COURSE_RECORD_SORT_CONDITION: CourseRecordSortCondition = {
  key: 'courseClass',
  direction: 'asc',
}

/**
 * コースレコードを指定列と方向で並べ替える。
 *
 * @param records - ソート対象のコースレコード。
 * @param sortCondition - 適用する列と方向。
 * @returns 元配列を変更せずに並べ替えたコースレコード。
 */
export const sortCourseRecords = (
  records: CourseRecordDTO[],
  sortCondition: CourseRecordSortCondition
): CourseRecordDTO[] => {
  const direction = sortCondition.direction === 'asc' ? 1 : -1

  return records
    .map((record, index) => ({ record, index }))
    .sort((leftEntry, rightEntry) => {
      const left = leftEntry.record
      const right = rightEntry.record
      let comparison = 0

      switch (sortCondition.key) {
        case 'title':
          comparison = left.name.localeCompare(right.name, 'ja') * direction
          break
        case 'courseClass': {
          const leftValue =
            COURSE_CLASS_SORT_VALUE.get(left.class.toLowerCase()) ?? Number.MAX_VALUE
          const rightValue =
            COURSE_CLASS_SORT_VALUE.get(right.class.toLowerCase()) ?? Number.MAX_VALUE
          comparison = (leftValue - rightValue) * direction
          break
        }
        case 'score':
          comparison = compareNumberWithUnplayedLast(
            { isPlayed: left.is_played, value: left.score },
            { isPlayed: right.is_played, value: right.score },
            direction
          )
          break
        case 'lamp': {
          const result = compareComboLamp(
            { ...left, score: left.score / 3 },
            { ...right, score: right.score / 3 }
          )
          comparison = result.comparison * (result.skipDirection ? 1 : direction)
          break
        }
        case 'hardLamp':
          comparison = compareNumberWithUnplayedLast(
            { isPlayed: left.is_played, value: Number(left.is_clear) },
            { isPlayed: right.is_played, value: Number(right.is_clear) },
            direction
          )
          break
      }

      return comparison || leftEntry.index - rightEntry.index
    })
    .map(({ record }) => record)
}
