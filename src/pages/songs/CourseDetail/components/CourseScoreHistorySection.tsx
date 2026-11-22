import { Dialog } from '@kobalte/core/dialog'
import { createQuery } from '@tanstack/solid-query'
import List from 'lucide-solid/icons/list'
import { createSignal, Show } from 'solid-js'
import { LoadError, Loading } from '../../../../components'
import { getAppButtonClass } from '../../../../components/common/AppButton'
import { AppDialog } from '../../../../components/common/AppDialog'
import { courseScoreHistoryQueryOptions } from '../../../../queries/courses'
import { COURSE_MAX_SCORE } from '../../../../utils/courseStats'
import {
  SCORE_HISTORY_CLOSE_LABEL,
  SCORE_HISTORY_EMPTY_LABEL,
  SCORE_HISTORY_MAX_ENTRIES_LABEL,
  SCORE_HISTORY_SECTION_LABEL,
  SCORE_HISTORY_TABLE_TOGGLE_LABEL,
} from '../../components/chartDetail/constants'
import ScoreHistoryChart from '../../components/chartDetail/ScoreHistoryChart'
import ScoreHistoryTable from '../../components/chartDetail/ScoreHistoryTable'

/**
 * ログインユーザーのコースベスト履歴を取得し、推移を表示する。明細は見出し横のボタンからダイアログで開く。
 *
 * @param props - 対象ユーザー名とコース表示ID。
 * @returns コースのスコア履歴セクション。
 */
const CourseScoreHistorySection = (props: { username: string; displayId: string }) => {
  const history = createQuery(() => courseScoreHistoryQueryOptions(props.username, props.displayId))
  const [tableOpen, setTableOpen] = createSignal(false)
  const entries = () => history.data?.entries ?? []

  return (
    <section class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="flex flex-wrap items-baseline gap-2 text-lg font-semibold">
          {SCORE_HISTORY_SECTION_LABEL}
          <span class="text-xs font-normal text-text-muted">{SCORE_HISTORY_MAX_ENTRIES_LABEL}</span>
        </h2>
        <Show when={entries().length > 0}>
          <AppDialog
            open={tableOpen()}
            onOpenChange={setTableOpen}
            placement="sheet"
            size="2xl"
            height="max80"
            title={SCORE_HISTORY_SECTION_LABEL}
            closeLabel={SCORE_HISTORY_CLOSE_LABEL}
            scroll="grow"
            bodyClass="mt-4"
            trigger={
              <Dialog.Trigger
                as="button"
                type="button"
                class={getAppButtonClass({ size: 'sm', class: 'gap-1.5' })}
              >
                <List class="h-4 w-4" aria-hidden="true" />
                {SCORE_HISTORY_TABLE_TOGGLE_LABEL}
              </Dialog.Trigger>
            }
          >
            <ScoreHistoryTable entries={entries()} />
          </AppDialog>
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
