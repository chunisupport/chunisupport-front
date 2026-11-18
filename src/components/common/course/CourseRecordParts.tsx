import { Show } from 'solid-js'
import type { CourseRecordDTO } from '../../../types/api'
import {
  courseClassBadgeClass,
  formatCourseClass,
  resolveCourseClassEmblemName,
} from '../../../utils/courseClassDisplay'
import { COURSE_TRACK_COUNT } from '../../../utils/courseScoreRank'
import { ClassEmblem } from '../profile/ClassEmblem'
import { RecordHardLampCell, RecordLampCell } from '../record/RecordDisplayParts'

/** エンブレム非対応クラス（EXなど）を円形バッジで表示するためのレイアウトクラス */
const COURSE_CLASS_CIRCLE_BADGE_CLASS =
  'inline-flex size-7 shrink-0 items-center justify-center rounded-full font-oswald text-base font-bold leading-none'

/**
 * コースクラスをエンブレム、非対応クラスは円形バッジで表示する。
 *
 * @param props - 表示するコースクラスのAPI値。
 * @returns コースクラスの表示要素。
 */
export const CourseClassMark = (props: { courseClass: string }) => (
  <Show
    when={resolveCourseClassEmblemName(props.courseClass)}
    fallback={
      <span
        class={`${COURSE_CLASS_CIRCLE_BADGE_CLASS} ${courseClassBadgeClass(props.courseClass)}`}
      >
        {formatCourseClass(props.courseClass)}
      </span>
    }
  >
    {(emblem) => (
      <ClassEmblem
        emblem={emblem()}
        base={null}
        class="h-8"
        label={formatCourseClass(props.courseClass)}
      />
    )}
  </Show>
)

/**
 * コースレコードのコンボランプを表示する。
 *
 * @param props - 表示対象のコースレコード。
 * @returns コンボランプセル。
 */
export const CourseLampCell = (props: { record: CourseRecordDTO }) => (
  <RecordLampCell
    record={{
      is_played: props.record.is_played,
      combo_lamp: props.record.combo_lamp,
      // 理論値判定を通常譜面と同じ基準で行うため1曲平均へ換算する
      score: props.record.score / COURSE_TRACK_COUNT,
    }}
  />
)

/**
 * コースレコードのクリア状態をハードランプ欄として表示する。
 *
 * @param props - 表示対象のコースレコード。
 * @returns クリアランプセル。
 */
export const CourseHardLampCell = (props: { record: CourseRecordDTO }) => (
  <RecordHardLampCell
    record={{
      is_played: props.record.is_played,
      clear_lamp: props.record.is_clear ? 'CLEAR' : null,
    }}
  />
)
