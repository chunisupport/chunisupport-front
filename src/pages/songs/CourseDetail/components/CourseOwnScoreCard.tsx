import { Show } from 'solid-js'
import {
  CourseClassMark,
  CourseRecordLampBadges,
} from '../../../../components/common/course/CourseRecordParts'
import { RecordScoreRank } from '../../../../components/common/record/RecordDisplayParts'
import type { CourseRecordDTO } from '../../../../types/api'
import { getCourseScoreRank } from '../../../../utils/courseScoreRank'
import { calculateCoursePerTrackAverageScore } from '../../../../utils/courseStats'
import { COURSE_PAGE_COPY } from '../../constants'

type Props = {
  /** ログインユーザーのコースレコード */
  record: CourseRecordDTO
}

/** 自己ベストカードの共通レイアウトクラス（楽曲詳細の自己スコアカードと揃える） */
const OWN_COURSE_CARD_CLASS =
  'flex min-h-24 items-center gap-3 rounded-lg border border-border bg-surface p-4'

/**
 * ログインユーザーのコース自己ベスト（スコア・換算ランク・1曲平均・ランプ）を表示する。
 *
 * @param props - 表示対象のコースレコード。
 * @returns コース自己ベストカード。
 */
const CourseOwnScoreCard = (props: Props) => {
  const scoreRank = () => getCourseScoreRank(props.record.score)
  const perTrackAverage = () => calculateCoursePerTrackAverageScore(props.record.score)

  return (
    <section>
      <h2 class="mb-3 text-lg font-semibold">{COURSE_PAGE_COPY.ownRecordHeading}</h2>
      <div class={OWN_COURSE_CARD_CLASS}>
        <CourseClassMark courseClass={props.record.class} size="md" />
        <Show
          when={props.record.is_played}
          fallback={
            <span class="ml-auto text-sm text-text-muted">{COURSE_PAGE_COPY.notPlayed}</span>
          }
        >
          <div class="ml-auto flex min-w-0 flex-col items-end gap-1.5">
            <div class="flex items-baseline gap-1.5">
              <span class="font-jost text-xl font-semibold tabular-nums">
                {props.record.score.toLocaleString('ja-JP')}
              </span>
              <RecordScoreRank rank={scoreRank()} class="text-xs" />
            </div>
            <span class="whitespace-nowrap font-jost text-xs text-text-muted tabular-nums">
              <abbr title={COURSE_PAGE_COPY.perTrackAverageLabel} class="no-underline">
                {COURSE_PAGE_COPY.perTrackAveragePrefix}
              </abbr>{' '}
              {perTrackAverage().toLocaleString('ja-JP')}
            </span>
            <CourseRecordLampBadges record={props.record} />
          </div>
        </Show>
      </div>
    </section>
  )
}

export default CourseOwnScoreCard
