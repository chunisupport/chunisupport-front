import { Show } from 'solid-js'
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
import { authSession } from '../../../stores/authSession'
import type { CourseRecordDTO } from '../../../types/api'
import { getCourseScoreRank } from '../../../utils/courseScoreRank'
import { formatUpdatedAt } from '../../../utils/recordUpdatedAt'
import type { CourseRecordColumnId } from './columns'

/**
 * 現在のログインユーザーが ADMIN 権限を持つか判定する。
 *
 * @returns ADMIN として認証済みなら true。
 */
const isAdminAuthenticated = (): boolean =>
  authSession.status === 'authenticated' && authSession.user?.account_type === 'ADMIN'

/** コースレコードの列IDごとのセル描画処理 */
const courseRecordColumnRenderers: Record<CourseRecordColumnId, ColumnRenderer<CourseRecordDTO>> = {
  title: (record) => (
    <Show when={isAdminAuthenticated()} fallback={<RecordTitleCell title={record.name} />}>
      <RecordTitleCell title={record.name} href={buildCourseDetailPath(record.id)} />
    </Show>
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
