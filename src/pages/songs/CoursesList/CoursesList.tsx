import { useQuery } from '@tanstack/solid-query'
import { For, Show } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import {
  CourseClassMark,
  CourseHardLampCell,
  CourseLampCell,
} from '../../../components/common/course/CourseRecordParts'
import {
  RECORD_ROW_HOVER_WITH_TOP_BORDER_CLASS,
  RecordScoreCell,
  RecordTitleCell,
} from '../../../components/common/record/RecordDisplayParts'
import { buildCourseDetailPath } from '../../../constants/routes'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { courseListQueryOptions } from '../../../queries/courses'
import { authSession } from '../../../stores/authSession'
import { getCourseScoreRank } from '../../../utils/courseScoreRank'
import { COURSE_PAGE_COPY } from '../constants'

/** コース一覧の1行を構成する列幅 */
const COURSE_ROW_GRID_CLASS =
  'grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_3rem_3rem] items-center gap-1 px-2'

/**
 * コースをクラス順に一覧表示し、ログイン中は自己ベストも並べる。
 *
 * @returns コース一覧ページ。
 */
const CoursesList = () => {
  const coursesQuery = useQuery(() => courseListQueryOptions(authSession.user?.username ?? null))

  useDocumentTitle(COURSE_PAGE_COPY.listTitle)

  return (
    <div class="mx-auto w-full max-w-4xl space-y-4 p-4">
      <h1 class="text-2xl font-semibold">{COURSE_PAGE_COPY.listTitle}</h1>
      <Show when={!coursesQuery.isError} fallback={<LoadError error={coursesQuery.error} />}>
        <Show when={coursesQuery.data} fallback={<Loading />}>
          {(data) => (
            <ul
              aria-label={COURSE_PAGE_COPY.listAriaLabel}
              class="overflow-hidden rounded-lg border-b border-border text-sm"
            >
              <For each={data().courses}>
                {(course) => (
                  <li class={`${COURSE_ROW_GRID_CLASS} ${RECORD_ROW_HOVER_WITH_TOP_BORDER_CLASS}`}>
                    <div class="flex justify-center font-oswald font-semibold">
                      <CourseClassMark courseClass={course.class} />
                    </div>
                    <RecordTitleCell title={course.name} href={buildCourseDetailPath(course.id)} />
                    <RecordScoreCell record={course} getRank={getCourseScoreRank} />
                    <CourseHardLampCell record={course} />
                    <CourseLampCell record={course} />
                  </li>
                )}
              </For>
            </ul>
          )}
        </Show>
      </Show>
    </div>
  )
}

export default CoursesList
