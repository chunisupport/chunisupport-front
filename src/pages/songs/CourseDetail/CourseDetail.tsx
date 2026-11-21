import { Button } from '@kobalte/core/button'
import { useNavigate, useParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { createMemo, Show } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import { CourseClassMark } from '../../../components/common/course/CourseRecordParts'
import { COURSES_PATH } from '../../../constants/routes'
import { joinDocumentTitleParts } from '../../../constants/site'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import {
  courseDetailQueryOptions,
  courseListQueryOptions,
  courseStatsQueryOptions,
  courseTrackScoresQueryOptions,
} from '../../../queries/courses'
import { ratingBandsQueryOptions } from '../../../queries/ratingBands'
import { userRatingQueryOptions } from '../../../queries/users'
import { authSession } from '../../../stores/authSession'
import { formatCourseClassLabel } from '../../../utils/courseClassDisplay'
import { buildCourseTrackBestRecords } from '../../../utils/courseTracks'
import NotFoundPage from '../../NotFoundPage'
import { COURSE_PAGE_COPY } from '../constants'
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
  const course = createMemo(() =>
    coursesQuery.data?.courses.find((candidate) => candidate.id === params.displayid)
  )
  const detailQuery = useQuery(() => ({
    ...courseDetailQueryOptions(params.displayid),
    enabled: Boolean(course()),
  }))
  const tracks = () => detailQuery.data?.tracks ?? []
  const trackScoresQuery = useQuery(() =>
    courseTrackScoresQueryOptions(
      authSession.user?.last_score_update && tracks().some((track) => track.candidates.length > 0)
        ? username()
        : null
    )
  )
  const trackRecords = createMemo(() => {
    const records = trackScoresQuery.data
    return records ? buildCourseTrackBestRecords(records) : undefined
  })
  // 存在しないコースでは統計APIを呼ばない
  const statsQuery = useQuery(() => ({
    ...courseStatsQueryOptions(params.displayid),
    enabled: Boolean(course()),
  }))
  const ratingBandsQuery = useQuery(() => ratingBandsQueryOptions())
  const ownRatingQuery = useQuery(() => userRatingQueryOptions(username()))

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

              <header class="flex items-center gap-3">
                <div class="flex shrink-0">
                  <CourseClassMark courseClass={currentCourse().class} size="lg" />
                </div>
                <div class="min-w-0 space-y-0.5">
                  <p class="font-oswald text-xs font-semibold tracking-wider text-text-muted">
                    {COURSE_PAGE_COPY.classPrefix} {formatCourseClassLabel(currentCourse().class)}
                  </p>
                  <h1 class="font-sans text-xl leading-snug font-semibold break-words sm:text-2xl">
                    {currentCourse().name}
                  </h1>
                </div>
              </header>

              <div
                class="grid grid-cols-1 items-start gap-4"
                classList={{
                  'lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]':
                    isAuthenticated(),
                }}
              >
                <CourseTracksSection
                  tracks={tracks()}
                  loading={detailQuery.isPending}
                  error={detailQuery.isError ? detailQuery.error : undefined}
                  records={trackRecords()}
                  scoreError={trackScoresQuery.isError}
                />
                <Show when={isAuthenticated()}>
                  <div class="min-w-0 space-y-4">
                    <CourseOwnScoreCard record={currentCourse()} />
                    <Show when={currentCourse().is_played && username()}>
                      {(currentUsername) => (
                        <CourseScoreHistorySection
                          username={currentUsername()}
                          displayId={currentCourse().id}
                        />
                      )}
                    </Show>
                  </div>
                </Show>
              </div>

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
