import { Show } from 'solid-js'
import { CourseClassMark } from '../../../../components/common/course/CourseRecordParts'
import {
  RECORD_LAMP_COLUMN_CLASS,
  RecordScoreRank,
  renderDefaultRecordHardLampBadge,
  renderDefaultRecordLampBadge,
} from '../../../../components/common/record/RecordDisplayParts'
import { getDefaultRecordLampAccessibleLabel } from '../../../../components/common/record/recordLampLabel'
import type { CourseRecordDTO } from '../../../../types/api'
import { COURSE_TRACK_COUNT, getCourseScoreRank } from '../../../../utils/courseScoreRank'
import { calculateCoursePerTrackAverageScore } from '../../../../utils/courseStats'
import { formatUpdatedAt } from '../../../../utils/recordUpdatedAt'
import { COURSE_PAGE_COPY } from '../../constants'

type Props = {
  /** ログインユーザーのコースレコード */
  record: CourseRecordDTO
}

/** 自己ベストカードの共通レイアウトクラス */
const OWN_COURSE_CARD_CLASS =
  'flex min-h-24 flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4'

/**
 * コースのクリア・コンボランプの読み上げ文言を生成する。
 *
 * @param record - 表示対象のコースレコード。
 * @returns クリア状態とコンボランプを含む読み上げ文言。
 */
const buildCourseLampsAccessibleLabel = (record: CourseRecordDTO): string => {
  const clearLabel = record.is_clear ? 'CLEAR' : '未クリア'
  const comboLabel = getDefaultRecordLampAccessibleLabel(
    record.combo_lamp,
    record.score / COURSE_TRACK_COUNT
  )
  return `クリアランプ ${clearLabel}、コンボランプ ${comboLabel}`
}

/**
 * ログインユーザーのコース自己ベスト（スコア・換算ランク・1曲平均・ランプ・更新日）を表示する。
 *
 * @param props - 表示対象のコースレコード。
 * @returns コース自己ベストカード。
 */
const CourseOwnScoreCard = (props: Props) => {
  const formattedUpdatedAt = () => formatUpdatedAt(props.record.updated_at)
  const scoreRank = () => getCourseScoreRank(props.record.score)
  const perTrackAverage = () => calculateCoursePerTrackAverageScore(props.record.score)

  return (
    <section>
      <h2 class="mb-3 text-lg font-semibold">{COURSE_PAGE_COPY.ownRecordHeading}</h2>
      <Show
        when={props.record.is_played}
        fallback={
          <div class={OWN_COURSE_CARD_CLASS}>
            <CourseClassMark courseClass={props.record.class} />
            <span class="text-sm text-text-muted">{COURSE_PAGE_COPY.notPlayed}</span>
          </div>
        }
      >
        <div class={OWN_COURSE_CARD_CLASS}>
          <div class="flex items-center gap-3">
            <CourseClassMark courseClass={props.record.class} />
            <Show when={formattedUpdatedAt()}>
              {(updatedAt) => (
                <span class="font-jost text-xs text-text-muted tabular-nums">
                  {COURSE_PAGE_COPY.updatedAtPrefix} {updatedAt()}
                </span>
              )}
            </Show>
          </div>

          <div class="ml-auto flex flex-wrap items-center justify-end gap-4">
            <div class="flex flex-col items-end">
              <div class="flex items-baseline gap-1.5">
                <span class="font-jost text-2xl font-semibold leading-none tabular-nums">
                  {props.record.score.toLocaleString('ja-JP')}
                </span>
                <RecordScoreRank rank={scoreRank()} class="text-xs" />
              </div>
              <span class="mt-1 font-jost text-xs text-text-muted tabular-nums">
                {COURSE_PAGE_COPY.perTrackAveragePrefix} {perTrackAverage().toLocaleString('ja-JP')}
              </span>
            </div>

            <div class={`relative flex ${RECORD_LAMP_COLUMN_CLASS}`}>
              <span class="sr-only">{buildCourseLampsAccessibleLabel(props.record)}</span>
              <div class="flex gap-2" aria-hidden="true">
                {renderDefaultRecordHardLampBadge(props.record.is_clear ? 'CLEAR' : null)}
                {renderDefaultRecordLampBadge(props.record.combo_lamp, {
                  is_played: true,
                  combo_lamp: props.record.combo_lamp,
                  // 理論値判定を通常譜面と同じ基準で行うため1曲平均へ換算する
                  score: props.record.score / COURSE_TRACK_COUNT,
                })}
              </div>
            </div>
          </div>
        </div>
      </Show>
    </section>
  )
}

export default CourseOwnScoreCard
