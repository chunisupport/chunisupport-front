import { useParams } from '@solidjs/router'
import { createQuery } from '@tanstack/solid-query'
import { Show } from 'solid-js'
import { LoadError, Loading } from '../../components'
import {
  CourseClassMark,
  CourseRecordLampBadges,
} from '../../components/common/course/CourseRecordParts'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { adminCourseRankingQueryOptions } from '../../queries/courses'
import { authSession } from '../../stores/authSession'
import { formatInteger } from '../../utils/numberFormat'
import AdminRankingTable from './AdminRankingTable'
import { ADMIN_RANKING_COPY } from './adminRanking.constants'

/**
 * 管理者向けにコース別の全体ランキングを表示する。
 *
 * @returns コース情報、登録者数および自己ベスト上位の一覧。
 */
const AdminCourseRankingPage = () => {
  const params = useParams<{ displayid: string }>()
  const ranking = createQuery(() =>
    adminCourseRankingQueryOptions(
      authSession.status === 'authenticated' && authSession.user?.account_type === 'ADMIN'
        ? authSession.user.username
        : null,
      params.displayid
    )
  )

  useDocumentTitle(ADMIN_RANKING_COPY.courseTitle)

  return (
    <main class="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4">
      <h1 class="text-2xl font-semibold">{ADMIN_RANKING_COPY.courseTitle}</h1>
      <Show when={!ranking.isError} fallback={<LoadError error={ranking.error} />}>
        <Show
          when={ranking.data}
          fallback={
            <div class="h-40">
              <Loading />
            </div>
          }
        >
          {(data) => (
            <>
              <section class="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
                <CourseClassMark courseClass={data().course.class} size="md" />
                <div class="min-w-0">
                  <h2 class="font-sans text-xl font-semibold break-words text-text">
                    {data().course.name}
                  </h2>
                  <p class="mt-1 text-sm text-text-muted">
                    {ADMIN_RANKING_COPY.total}: {formatInteger(data().total)}
                  </p>
                </div>
              </section>
              <AdminRankingTable
                caption={ADMIN_RANKING_COPY.courseTableCaption}
                entries={data().ranking}
                renderLamps={(entry) => (
                  <CourseRecordLampBadges record={entry} class="justify-center" />
                )}
              />
            </>
          )}
        </Show>
      </Show>
    </main>
  )
}

export default AdminCourseRankingPage
