import { createMemo, createResource, createSignal, Match, Show, Switch } from 'solid-js'

import { fetchRecentPlayerDataUpdates } from '../../api/register-data'
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
import { useSongsData } from '../../stores/songsData'
import { fetchCoursesWithCache } from '../../usecases/cache/fetchCoursesWithCache'
import {
  normalizePlayerDataResult,
  requestChangedSongMasters,
} from '../../usecases/registerScoreCommit'
import { formatPlayerMetricHistoryDateTime } from '../../utils/playerMetricHistory'
import { RegisterScoreResultView } from './RegisterScoreResultView'
import {
  resolveRegisterScoreChartLevel,
  resolveRegisterScoreCourseTitle,
  resolveRegisterScoreSongSortValues,
  resolveRegisterScoreSongTitle,
} from './registerScoreResolvers'

/**
 * 認証済みユーザーが保存済みの最新スコア更新結果を再確認する画面。
 *
 * @returns 最新更新差分、未保存状態、または取得状態に応じた画面。
 */
const LatestScoreUpdatePage = () => {
  const songsData = useSongsData()
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  useDocumentTitle(LATEST_SCORE_UPDATE_TITLE)

  /**
   * 最新更新結果と表示に必要なコースマスタを取得する。
   *
   * @returns 表示用に正規化した最新更新結果とコースマスタ。未保存の場合はnull。
   */
  const loadLatestUpdate = async () => {
    const updates = await fetchRecentPlayerDataUpdates()
    const results = updates.map(normalizePlayerDataResult)
    for (const result of results) {
      requestChangedSongMasters(result, {
        ensureSongsLoaded: songsData.ensureSongsLoaded,
        ensureWorldsendSongsLoaded: songsData.ensureWorldsendSongsLoaded,
      })
    }

    const courses = results.some((result) =>
      result.changes.some((change) => change.record_type === 'course')
    )
      ? await fetchCoursesWithCache()
          .then((response) => response.courses)
          .catch(() => [])
      : []

    return { updates, results, courses }
  }

  const [pageData] = createResource(loadLatestUpdate)
  const historyOptions = createMemo(() =>
    (pageData()?.updates ?? []).map((update, index) => ({
      index,
      label: `${index === 0 ? LATEST_SCORE_UPDATE_NEWEST_LABEL : formatPreviousScoreUpdateLabel(index)}${formatPlayerMetricHistoryDateTime(update.imported_at)}`,
    }))
  )
  const selectedOption = createMemo(() => historyOptions()[selectedIndex()])
  const selectedResult = createMemo(() => pageData()?.results[selectedIndex()])

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <Show when={pageData.state !== 'ready' || pageData()?.results.length === 0}>
        <h1 class="text-2xl font-semibold">{LATEST_SCORE_UPDATE_TITLE}</h1>
      </Show>

      <Switch>
        <Match when={pageData.error}>
          <LoadError error={pageData.error} />
        </Match>
        <Match when={pageData.loading}>
          <section class="rounded-lg border border-border bg-surface p-6">
            <Loading />
          </section>
        </Match>
        <Match when={pageData()?.results.length === 0}>
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
                    resolveSongTitle={(change) =>
                      resolveRegisterScoreSongTitle(
                        change,
                        songsData.songsResponse.latest?.songs ?? [],
                        songsData.worldsendSongsResponse.latest?.songs ?? []
                      )
                    }
                    resolveChartLevel={(change) =>
                      resolveRegisterScoreChartLevel(
                        change,
                        songsData.songsResponse.latest?.songs ?? [],
                        songsData.worldsendSongsResponse.latest?.songs ?? []
                      )
                    }
                    resolveSongSortValues={(change) =>
                      resolveRegisterScoreSongSortValues(
                        change,
                        songsData.songsResponse.latest?.songs ?? []
                      )
                    }
                    resolveCourseTitle={(change) =>
                      resolveRegisterScoreCourseTitle(change, pageData()?.courses ?? [])
                    }
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
