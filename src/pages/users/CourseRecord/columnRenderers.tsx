import {
  CourseClassMark,
  CourseHardLampCell,
  CourseLampCell,
} from '../../../components/common/course/CourseRecordParts'
import {
  type ColumnRenderer,
  RECORD_CELL_BASE_CLASS,
  RecordScoreCell,
  RecordTitleCell,
  RecordUpdatedAtCell,
} from '../../../components/common/record/RecordDisplayParts'
import { buildCourseDetailPath } from '../../../constants/routes'
import { isFeatureEnabled } from '../../../lib/featureFlags'
import type { CourseRecordDTO } from '../../../types/api'
import { getCourseScoreRank } from '../../../utils/courseScoreRank'
import { formatUpdatedAt } from '../../../utils/recordUpdatedAt'
import type { CourseRecordColumnId } from './columns'

/** コースレコードの列IDごとのセル描画処理 */
const courseRecordColumnRenderers: Record<CourseRecordColumnId, ColumnRenderer<CourseRecordDTO>> = {
  title: (record) => (
    <RecordTitleCell
      title={record.name}
      href={isFeatureEnabled('course_pages') ? buildCourseDetailPath(record.id) : undefined}
    />
  ),
  courseClass: (record) => (
    <div class={`${RECORD_CELL_BASE_CLASS} font-oswald text-sm font-semibold`}>
      <CourseClassMark courseClass={record.class} />
    </div>
  ),
  score: (record) => <RecordScoreCell record={record} getRank={getCourseScoreRank} />,
  lamp: (record) => <CourseLampCell record={record} />,
  hardLamp: (record) => <CourseHardLampCell record={record} />,
  updatedAt: (record) => <RecordUpdatedAtCell record={record} formatUpdatedAt={formatUpdatedAt} />,
}

/**
 * コースレコード列IDに対応する共通テーブル用セル描画処理を取得する。
 *
 * @param columnId - 描画対象の列ID。
 * @returns 指定列のセル描画処理。
 */
export const getCourseRecordColumnRenderer = (
  columnId: CourseRecordColumnId
): ColumnRenderer<CourseRecordDTO> => courseRecordColumnRenderers[columnId]
