import { createQuery } from '@tanstack/solid-query'
import { createMemo, createSignal, Match, Show, Switch } from 'solid-js'

import { LoadError, Loading } from '../../components'
import { AppSelect } from '../../components/common/AppSelect'
import {
  formatPreviousScoreUpdateLabel,
  LATEST_SCORE_UPDATE_CHANGED_SONGS_EMPTY_MESSAGE,
  LATEST_SCORE_UPDATE_EMPTY_MESSAGE,
  LATEST_SCORE_UPDATE_HISTORY_LABEL,
  LATEST_SCORE_UPDATE_NEWEST_LABEL,
  LATEST_SCORE_UPDATE_TITLE,
} from '../../constants/playerLatestUpdate'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { recentScoreUpdatesQueryOptions } from '../../queries/users'
import { authSession } from '../../stores/authSession'
import { normalizePlayerDataResult } from '../../usecases/registerScoreCommit'
import { formatPlayerMetricHistoryDateTime } from '../../utils/playerMetricHistory'
import { RegisterScoreResultView } from './RegisterScoreResultView'

/**
 * 認証済みユーザーが保存済みの最新スコア更新結果を再確認する画面。
 *
 * @returns 最新更新差分、未保存状態、または取得状態に応じた画面。
 */
const LatestScoreUpdatePage = () => {
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  useDocumentTitle(LATEST_SCORE_UPDATE_TITLE)

  const updates = createQuery(() => recentScoreUpdatesQueryOptions(authSession.user?.username))
  const historyOptions = createMemo(() =>
    (updates.data ?? []).map((update, index) => ({
      index,
      label: `${index === 0 ? LATEST_SCORE_UPDATE_NEWEST_LABEL : formatPreviousScoreUpdateLabel(index)}${formatPlayerMetricHistoryDateTime(update.imported_at)}`,
    }))
  )
  const selectedOption = createMemo(() => historyOptions()[selectedIndex()])
  const selectedResult = createMemo(() => {
    const update = updates.data?.[selectedIndex()]
    return update && normalizePlayerDataResult(update)
  })

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <Show when={!updates.isSuccess || !updates.data.length}>
        <h1 class="text-2xl font-semibold">{LATEST_SCORE_UPDATE_TITLE}</h1>
      </Show>

      <Switch>
        <Match when={updates.error}>
          <LoadError error={updates.error} />
        </Match>
        <Match when={updates.isPending}>
          <section class="rounded-lg border border-border bg-surface p-6">
            <Loading />
          </section>
        </Match>
        <Match when={updates.data?.length === 0}>
          <p class="rounded-md border border-border bg-surface px-3 py-4 text-center text-sm text-text-muted">
            {LATEST_SCORE_UPDATE_EMPTY_MESSAGE}
          </p>
        </Match>
        <Match when={selectedResult()}>
          {(result) => (
            <>
              <Show when={historyOptions().length > 1}>
                <AppSelect
                  rootClass="w-full max-w-sm"
                  options={historyOptions()}
                  optionValue="index"
                  optionTextValue="label"
                  value={selectedOption()}
                  onChange={(option) => {
                    if (option) setSelectedIndex(option.index)
                  }}
                  label={LATEST_SCORE_UPDATE_HISTORY_LABEL}
                  formatLabel={(option) => option.label}
                />
              </Show>
              <Show when={result()} keyed>
                {(selectedResult) => (
                  <RegisterScoreResultView
                    pageTitle={LATEST_SCORE_UPDATE_TITLE}
                    result={selectedResult}
                    changedSongsEmptyMessage={LATEST_SCORE_UPDATE_CHANGED_SONGS_EMPTY_MESSAGE}
                  />
                )}
              </Show>
            </>
          )}
        </Match>
      </Switch>
    </main>
  )
}

export default LatestScoreUpdatePage
