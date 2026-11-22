import { Collapsible } from '@kobalte/core/collapsible'
import { createQuery } from '@tanstack/solid-query'
import { Show } from 'solid-js'
import { LoadError, Loading } from '../../../../components'
import { AppDisclosureTrigger } from '../../../../components/common/AppDisclosureTrigger'
import { courseScoreHistoryQueryOptions } from '../../../../queries/courses'
import { COURSE_MAX_SCORE } from '../../../../utils/courseStats'
import {
  SCORE_HISTORY_EMPTY_LABEL,
  SCORE_HISTORY_SECTION_LABEL,
  SCORE_HISTORY_TABLE_TOGGLE_LABEL,
} from '../../components/chartDetail/constants'
import ScoreHistoryChart from '../../components/chartDetail/ScoreHistoryChart'
import ScoreHistoryTable from '../../components/chartDetail/ScoreHistoryTable'

/**
 * ログインユーザーのコースベスト履歴を取得し、推移と明細を表示する。
 *
 * @param props - 対象ユーザー名とコース表示ID。
 * @returns コースのスコア履歴セクション。
 */
const CourseScoreHistorySection = (props: { username: string; displayId: string }) => {
  const history = createQuery(() => courseScoreHistoryQueryOptions(props.username, props.displayId))

  return (
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">{SCORE_HISTORY_SECTION_LABEL}</h2>
      <Show when={!history.isError} fallback={<LoadError error={history.error} />}>
        <Show when={!history.isPending} fallback={<Loading />}>
          <Show when={history.data}>
            {(data) => (
              <Show
                when={data().entries.length > 0}
                fallback={<p class="text-sm text-text-muted">{SCORE_HISTORY_EMPTY_LABEL}</p>}
              >
                <ScoreHistoryChart entries={data().entries} maxScore={COURSE_MAX_SCORE} />
                <Collapsible defaultOpen={false}>
                  <AppDisclosureTrigger
                    variant="compact"
                    label={SCORE_HISTORY_TABLE_TOGGLE_LABEL}
                    summary={`${data().entries.length}件`}
                  />
                  <Collapsible.Content class="pt-3">
                    <ScoreHistoryTable entries={data().entries} />
                  </Collapsible.Content>
                </Collapsible>
              </Show>
            )}
          </Show>
        </Show>
      </Show>
    </section>
  )
}

export default CourseScoreHistorySection
