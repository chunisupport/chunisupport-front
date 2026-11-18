import { A, useParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { createMemo, For, Show } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import {
  CourseClassMark,
  CourseHardLampCell,
  CourseLampCell,
} from '../../../components/common/course/CourseRecordParts'
import { RecordScoreCell } from '../../../components/common/record/RecordDisplayParts'
import { COURSES_PATH } from '../../../constants/routes'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { courseListQueryOptions, courseStatsQueryOptions } from '../../../queries/courses'
import { authSession } from '../../../stores/authSession'
import type { CourseStatsBandDTO } from '../../../types/api'
import { calculateChartStatsPercent } from '../../../utils/chartStats'
import { getCourseScoreRank } from '../../../utils/courseScoreRank'
import NotFoundPage from '../../NotFoundPage'
import { COURSE_PAGE_COPY } from '../constants'

/** 統計表の数値セル */
const STATS_CELL_CLASS = 'px-2 py-1.5 text-right font-jost tabular-nums whitespace-nowrap'

/**
 * 人数をプレイ人数に対する割合として表示用に整形する。
 *
 * @param count - 対象の人数。
 * @param band - 母数を持つレート帯統計。
 * @returns 小数1桁のパーセント表記。プレイ人数が0の場合はハイフン。
 */
const formatRate = (count: number, band: CourseStatsBandDTO): string => {
  const percent = calculateChartStatsPercent(count, band.player_count)
  return percent === null ? '-' : `${percent.toFixed(1)}%`
}

/**
 * スコアを整数の桁区切りで表示用に整形する。
 *
 * @param score - 平均・中央値スコア。
 * @returns 整形済みスコア。nullの場合はハイフン。
 */
const formatStatsScore = (score: number | null): string =>
  score === null ? '-' : Math.round(score).toLocaleString('ja-JP')

/**
 * コースの基本情報、自己ベスト、レート帯別統計を表示する。
 *
 * @returns コース詳細ページ。
 */
const CourseDetail = () => {
  const params = useParams<{ displayid: string }>()
  const isAuthenticated = () => authSession.status === 'authenticated'
  const coursesQuery = useQuery(() => courseListQueryOptions(authSession.user?.username ?? null))
  // shortcut: 単件APIを使わず一覧キャッシュから引く。収録曲など一覧にない情報を出すときは単件APIへ切り替える
  const course = createMemo(() =>
    coursesQuery.data?.courses.find((candidate) => candidate.id === params.displayid)
  )
  // 存在しないコースでは統計APIを呼ばない
  const statsQuery = useQuery(() => ({
    ...courseStatsQueryOptions(params.displayid),
    enabled: Boolean(course()),
  }))

  useDocumentTitle(() => course()?.name ?? COURSE_PAGE_COPY.listTitle)

  return (
    <Show when={!coursesQuery.isError} fallback={<LoadError error={coursesQuery.error} />}>
      <Show when={coursesQuery.data} fallback={<Loading />}>
        <Show when={course()} fallback={<NotFoundPage />}>
          {(currentCourse) => (
            <div class="mx-auto w-full max-w-4xl space-y-4 p-4">
              <A href={COURSES_PATH} class="text-sm text-action-primary hover:underline">
                {COURSE_PAGE_COPY.back}
              </A>

              <div class="flex items-center gap-3">
                <div class="font-oswald font-semibold">
                  <CourseClassMark courseClass={currentCourse().class} />
                </div>
                <h1 class="font-sans text-2xl font-semibold">{currentCourse().name}</h1>
              </div>

              <Show when={isAuthenticated()}>
                <section class="space-y-2 rounded-lg border border-border bg-surface p-3">
                  <h2 class="font-semibold">{COURSE_PAGE_COPY.ownRecordHeading}</h2>
                  <Show
                    when={currentCourse().is_played}
                    fallback={<p class="text-text-muted">{COURSE_PAGE_COPY.notPlayed}</p>}
                  >
                    <div class="flex items-center gap-4 text-lg">
                      <RecordScoreCell record={currentCourse()} getRank={getCourseScoreRank} />
                      <CourseHardLampCell record={currentCourse()} />
                      <CourseLampCell record={currentCourse()} />
                    </div>
                  </Show>
                </section>
              </Show>

              <section class="space-y-2">
                <h2 class="font-semibold">{COURSE_PAGE_COPY.statsHeading}</h2>
                <Show when={!statsQuery.isError} fallback={<LoadError error={statsQuery.error} />}>
                  <Show
                    when={statsQuery.data}
                    fallback={<Loading ariaLabel={COURSE_PAGE_COPY.statsLoadingLabel} />}
                  >
                    {(stats) => (
                      <Show
                        when={stats().stats.length > 0}
                        fallback={<p class="text-text-muted">{COURSE_PAGE_COPY.statsEmpty}</p>}
                      >
                        <div class="overflow-x-auto rounded-lg border border-border">
                          <table class="w-full bg-surface text-sm">
                            <thead>
                              <tr class="border-b border-border text-text-muted">
                                <For each={Object.values(COURSE_PAGE_COPY.statsColumns)}>
                                  {(label) => (
                                    <th class="px-2 py-1.5 text-right font-semibold whitespace-nowrap first:text-left">
                                      {label}
                                    </th>
                                  )}
                                </For>
                              </tr>
                            </thead>
                            <tbody>
                              <For each={stats().stats}>
                                {(band) => (
                                  <tr class="border-t border-border">
                                    <th class="px-2 py-1.5 text-left font-jost font-semibold whitespace-nowrap">
                                      {band.rating_band}
                                    </th>
                                    <td class={STATS_CELL_CLASS}>
                                      {band.player_count.toLocaleString('ja-JP')}
                                    </td>
                                    <td class={STATS_CELL_CLASS}>
                                      {formatStatsScore(band.average_score)}
                                    </td>
                                    <td class={STATS_CELL_CLASS}>
                                      {formatStatsScore(band.median_score)}
                                    </td>
                                    <td class={STATS_CELL_CLASS}>
                                      {formatRate(band.clear.clear, band)}
                                    </td>
                                    <td class={STATS_CELL_CLASS}>
                                      {formatRate(band.combo.fc + band.combo.aj, band)}
                                    </td>
                                    <td class={STATS_CELL_CLASS}>
                                      {formatRate(band.combo.aj, band)}
                                    </td>
                                  </tr>
                                )}
                              </For>
                            </tbody>
                          </table>
                        </div>
                      </Show>
                    )}
                  </Show>
                </Show>
              </section>
            </div>
          )}
        </Show>
      </Show>
    </Show>
  )
}

export default CourseDetail
