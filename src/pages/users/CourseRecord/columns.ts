import { getRecordColumnBaseDefinition } from '../utils/recordColumnDefinitions'
import type { ColumnDefinitionBase } from '../utils/recordTableColumns'

/** コースレコード表で表示する列ID */
export type CourseRecordColumnId =
  | 'title'
  | 'courseClass'
  | 'score'
  | 'lamp'
  | 'hardLamp'
  | 'updatedAt'

/** コースレコード表で利用するソートキー */
export type CourseRecordSortKey = CourseRecordColumnId

/** コースレコード表の列定義 */
export type CourseRecordColumnDefinition = ColumnDefinitionBase<
  CourseRecordColumnId,
  CourseRecordSortKey
>

/**
 * 既存レコード表の列幅を使ってコースレコード列を定義する。
 *
 * @returns タイトル、クラス、スコア、AJ、クリア、更新日の列定義。
 */
const createCourseRecordColumnDefinitions = (): CourseRecordColumnDefinition[] => {
  const title = getRecordColumnBaseDefinition('title')
  const difficulty = getRecordColumnBaseDefinition('difficulty')
  const score = getRecordColumnBaseDefinition('score')
  const lamp = getRecordColumnBaseDefinition('lamp')
  const hardLamp = getRecordColumnBaseDefinition('hardLamp')
  const updatedAt = getRecordColumnBaseDefinition('updatedAt')

  return [
    { ...title, id: 'title', label: 'タイトル', sortKey: 'title', defaultVisible: true },
    {
      ...difficulty,
      id: 'courseClass',
      label: 'クラス',
      sortKey: 'courseClass',
      defaultVisible: true,
    },
    { ...score, id: 'score', sortKey: 'score', defaultVisible: true },
    { ...lamp, id: 'lamp', sortKey: 'lamp', defaultVisible: true },
    { ...hardLamp, id: 'hardLamp', label: 'クリア', sortKey: 'hardLamp', defaultVisible: true },
    { ...updatedAt, id: 'updatedAt', sortKey: 'updatedAt', defaultVisible: true },
  ]
}

/** コースレコード表で常に表示する列定義 */
export const COURSE_RECORD_COLUMN_DEFINITIONS = createCourseRecordColumnDefinitions()
