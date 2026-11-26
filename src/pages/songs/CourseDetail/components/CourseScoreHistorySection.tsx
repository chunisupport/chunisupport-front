import { createQuery } from '@tanstack/solid-query'
import { Show } from 'solid-js'
import { LoadError, Loading } from '../../../../components'
import { courseScoreHistoryQueryOptions } from '../../../../queries/courses'
import { COURSE_MAX_SCORE } from '../../../../utils/courseStats'
import {
  SCORE_HISTORY_EMPTY_LABEL,
  SCORE_HISTORY_MAX_ENTRIES_LABEL,
  SCORE_HISTORY_SECTION_LABEL,
} from '../../components/chartDetail/constants'
import ScoreHistoryChart from '../../components/chartDetail/ScoreHistoryChart'
import ScoreHistoryTable from '../../components/chartDetail/ScoreHistoryTable'
import ScoreHistoryTableDialog from '../../components/chartDetail/ScoreHistoryTableDialog'

/**
 * ログインユーザーのコースベスト履歴を取得し、推移を表示する。明細は見出し横のボタンからダイアログで開く。
 *
 * @param props - 対象ユーザー名とコース表示ID。
 * @returns コースのスコア履歴セクション。
 */
const CourseScoreHistorySection = (props: { username: string; displayId: string }) => {
  const history = createQuery(() => courseScoreHistoryQueryOptions(props.username, props.displayId))
  const entries = () => history.data?.entries ?? []

  return (
    <section class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="flex flex-wrap items-baseline gap-2 text-lg font-semibold">
          {SCORE_HISTORY_SECTION_LABEL}
          <span class="text-xs font-normal text-text-muted">{SCORE_HISTORY_MAX_ENTRIES_LABEL}</span>
        </h2>
        <Show when={entries().length > 0}>
          <ScoreHistoryTableDialog>
            <ScoreHistoryTable entries={entries()} />
          </ScoreHistoryTableDialog>
        </Show>
      </div>
      <Show when={!history.isError} fallback={<LoadError error={history.error} />}>
        <Show when={!history.isPending} fallback={<Loading />}>
          <Show
            when={entries().length > 0}
            fallback={<p class="text-sm text-text-muted">{SCORE_HISTORY_EMPTY_LABEL}</p>}
          >
            <ScoreHistoryChart entries={entries()} maxScore={COURSE_MAX_SCORE} />
          </Show>
        </Show>
      </Show>
    </section>
  )
}

export default CourseScoreHistorySection
