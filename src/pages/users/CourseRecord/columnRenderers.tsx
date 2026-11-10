import { Show } from 'solid-js'
import { ClassEmblem } from '../../../components/common/profile/ClassEmblem'
import {
  type ColumnRenderer,
  RECORD_CELL_BASE_CLASS,
  RecordHardLampCell,
  RecordLampCell,
  RecordScoreCell,
  RecordTitleCell,
  RecordUpdatedAtCell,
} from '../../../components/common/record/RecordDisplayParts'
import type { CourseRecordDTO } from '../../../types/api'
import {
  courseClassBadgeClass,
  formatCourseClass,
  resolveCourseClassEmblemName,
} from '../../../utils/courseClassDisplay'
import { getCourseScoreRank } from '../../../utils/courseScoreRank'
import { formatUpdatedAt } from '../../../utils/recordUpdatedAt'
import type { CourseRecordColumnId } from './columns'
import { COURSE_RECORD_CLASS_CIRCLE_BADGE_CLASS } from './constants'

/** コースレコードの列IDごとのセル描画処理 */
const courseRecordColumnRenderers: Record<CourseRecordColumnId, ColumnRenderer<CourseRecordDTO>> = {
  title: (record) => <RecordTitleCell title={record.name} />,
  courseClass: (record) => (
    <div class={`${RECORD_CELL_BASE_CLASS} font-oswald text-sm font-semibold`}>
      <Show
        when={resolveCourseClassEmblemName(record.class)}
        fallback={
          <span
            class={`${COURSE_RECORD_CLASS_CIRCLE_BADGE_CLASS} ${courseClassBadgeClass(record.class)}`}
          >
            {formatCourseClass(record.class)}
          </span>
        }
      >
        {(emblem) => (
          <ClassEmblem
            emblem={emblem()}
            base={null}
            class="h-8"
            label={formatCourseClass(record.class)}
          />
        )}
      </Show>
    </div>
  ),
  score: (record) => <RecordScoreCell record={record} getRank={getCourseScoreRank} />,
  lamp: (record) => (
    <RecordLampCell
      record={{
        is_played: record.is_played,
        combo_lamp: record.combo_lamp,
        score: record.score / 3,
      }}
    />
  ),
  hardLamp: (record) => (
    <RecordHardLampCell
      record={{
        is_played: record.is_played,
        clear_lamp: record.is_clear ? 'CLEAR' : null,
      }}
    />
  ),
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
