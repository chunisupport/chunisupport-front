import { Button } from '@kobalte/core/button'
import { useNavigate, useParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { createMemo, Show } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import { CourseClassMark } from '../../../components/common/course/CourseRecordParts'
import { COURSES_PATH } from '../../../constants/routes'
import { joinDocumentTitleParts } from '../../../constants/site'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { courseListQueryOptions, courseStatsQueryOptions } from '../../../queries/courses'
import { ratingBandsQueryOptions } from '../../../queries/ratingBands'
import { userRatingQueryOptions } from '../../../queries/users'
import { authSession } from '../../../stores/authSession'
import { formatCourseClass } from '../../../utils/courseClassDisplay'
import { findCourseAllStatsBand } from '../../../utils/courseStats'
import NotFoundPage from '../../NotFoundPage'
import { COURSE_PAGE_COPY } from '../constants'
import CourseOverviewCard from './components/CourseOverviewCard'
import CourseOwnScoreCard from './components/CourseOwnScoreCard'
import CourseScoreHistorySection from './components/CourseScoreHistorySection'
import CourseStatsSection from './components/CourseStatsSection'
import CourseTracksSection from './components/CourseTracksSection'

/**
 * コースの基本情報、自己ベストと履歴、プレイヤー統計を表示する。
 *
 * @returns コース詳細ページ。
 */
const CourseDetail = () => {
  const params = useParams<{ displayid: string }>()
  const navigate = useNavigate()
  const isAuthenticated = () => authSession.status === 'authenticated'
  const username = () => (isAuthenticated() ? (authSession.user?.username ?? null) : null)

  const coursesQuery = useQuery(() => courseListQueryOptions(username()))
  // shortcut: 単件APIを使わず一覧キャッシュから引く。収録曲など一覧にない情報を出すときは単件APIへ切り替える
  const course = createMemo(() =>
    coursesQuery.data?.courses.find((candidate) => candidate.id === params.displayid)
  )
  // 存在しないコースでは統計APIを呼ばない
  const statsQuery = useQuery(() => ({
    ...courseStatsQueryOptions(params.displayid),
    enabled: Boolean(course()),
  }))
  const ratingBandsQuery = useQuery(() => ratingBandsQueryOptions())
  const ownRatingQuery = useQuery(() => userRatingQueryOptions(username()))

  const allStats = createMemo(() =>
    statsQuery.data ? findCourseAllStatsBand(statsQuery.data.stats) : undefined
  )
  const ownBestAverage = createMemo(() => ownRatingQuery.data?.best_average)
  const ownScore = createMemo(() => {
    const currentCourse = course()
    return isAuthenticated() && currentCourse?.is_played ? currentCourse.score : undefined
  })

  /**
   * 遷移元があればブラウザ履歴で戻り、直接アクセス時はコース一覧へ戻る。
   *
   * @returns なし。
   */
  const handleBack = (): void => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(COURSES_PATH)
  }

  useDocumentTitle(() =>
    joinDocumentTitleParts(
      course()?.name ?? COURSE_PAGE_COPY.detailFallbackTitle,
      COURSE_PAGE_COPY.detailTitleSuffix
    )
  )

  return (
    <Show when={!coursesQuery.isError} fallback={<LoadError error={coursesQuery.error} />}>
      <Show when={coursesQuery.data} fallback={<Loading />}>
        <Show when={course()} fallback={<NotFoundPage />}>
          {(currentCourse) => (
            <div class="mx-auto w-full max-w-6xl space-y-4 p-4">
              <div class="text-sm">
                <Button
                  type="button"
                  onClick={handleBack}
                  class="cursor-pointer border-0 bg-transparent p-0 text-action-primary hover:underline"
                >
                  {COURSE_PAGE_COPY.back}
                </Button>
              </div>

              <header class="flex items-center gap-4">
                <div class="shrink-0">
                  <CourseClassMark courseClass={currentCourse().class} size="lg" />
                </div>
                <div class="min-w-0 space-y-0.5">
                  <h1 class="font-sans text-2xl font-semibold break-words">
                    {currentCourse().name}
                  </h1>
                  <p class="font-oswald text-sm font-medium tracking-wide text-text-muted">
                    {COURSE_PAGE_COPY.classPrefix} {formatCourseClass(currentCourse().class)}
                  </p>
                </div>
              </header>

              <CourseTracksSection />

              <CourseOverviewCard allStats={allStats()} />

              <Show when={isAuthenticated()}>
                <CourseOwnScoreCard record={currentCourse()} />
              </Show>

              <Show when={currentCourse().is_played && username()}>
                {(currentUsername) => (
                  <CourseScoreHistorySection
                    username={currentUsername()}
                    displayId={currentCourse().id}
                  />
                )}
              </Show>

              <CourseStatsSection
                stats={statsQuery.data?.stats}
                isLoading={statsQuery.isPending}
                error={statsQuery.isError ? statsQuery.error : undefined}
                bestAverage={ownBestAverage()}
                ratingBands={ratingBandsQuery.data}
                ownScore={ownScore()}
              />
            </div>
          )}
        </Show>
      </Show>
    </Show>
  )
}

export default CourseDetail
