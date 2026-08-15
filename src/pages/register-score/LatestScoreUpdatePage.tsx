import { createResource, Match, Switch } from 'solid-js'

import { fetchLatestPlayerDataUpdate } from '../../api/register-data'
import { LoadError, Loading } from '../../components'
import {
  LATEST_SCORE_UPDATE_CHANGED_SONGS_EMPTY_MESSAGE,
  LATEST_SCORE_UPDATE_EMPTY_MESSAGE,
  LATEST_SCORE_UPDATE_TITLE,
} from '../../constants/playerLatestUpdate'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useSongsData } from '../../stores/songsData'
import { fetchCoursesWithCache } from '../../usecases/cache/fetchCoursesWithCache'
import {
  normalizePlayerDataResult,
  requestChangedSongMasters,
} from '../../usecases/registerScoreCommit'
import { RegisterScoreResultView } from './RegisterScoreResultView'
import {
  resolveRegisterScoreChartLevel,
  resolveRegisterScoreCourseTitle,
  resolveRegisterScoreSongTitle,
} from './registerScoreResolvers'

/**
 * 認証済みユーザーが保存済みの最新スコア更新結果を再確認する画面。
 *
 * @returns 最新更新差分、未保存状態、または取得状態に応じた画面。
 */
const LatestScoreUpdatePage = () => {
  const songsData = useSongsData()

  useDocumentTitle(LATEST_SCORE_UPDATE_TITLE)

  /**
   * 最新更新結果と表示に必要なコースマスタを取得する。
   *
   * @returns 表示用に正規化した最新更新結果とコースマスタ。未保存の場合はnull。
   */
  const loadLatestUpdate = async () => {
    const latestUpdate = await fetchLatestPlayerDataUpdate()
    if (latestUpdate === null) {
      return null
    }

    const result = normalizePlayerDataResult(latestUpdate)
    requestChangedSongMasters(result, {
      ensureSongsLoaded: songsData.ensureSongsLoaded,
      ensureWorldsendSongsLoaded: songsData.ensureWorldsendSongsLoaded,
    })

    const courses = result.changes.some((change) => change.record_type === 'course')
      ? await fetchCoursesWithCache()
          .then((response) => response.courses)
          .catch(() => [])
      : []

    return { result, courses }
  }

  const [pageData] = createResource(loadLatestUpdate)

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <h1 class="text-2xl font-semibold">{LATEST_SCORE_UPDATE_TITLE}</h1>

      <Switch>
        <Match when={pageData.error}>
          <LoadError error={pageData.error} />
        </Match>
        <Match when={pageData.loading}>
          <section class="rounded-lg border border-border bg-surface p-6">
            <Loading />
          </section>
        </Match>
        <Match when={pageData() === null}>
          <p class="rounded-md border border-border bg-surface px-3 py-4 text-center text-sm text-text-muted">
            {LATEST_SCORE_UPDATE_EMPTY_MESSAGE}
          </p>
        </Match>
        <Match when={pageData()}>
          {(data) => (
            <RegisterScoreResultView
              result={data().result}
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
              resolveCourseTitle={(change) =>
                resolveRegisterScoreCourseTitle(change, data().courses)
              }
              changedSongsEmptyMessage={LATEST_SCORE_UPDATE_CHANGED_SONGS_EMPTY_MESSAGE}
            />
          )}
        </Match>
      </Switch>
    </main>
  )
}

export default LatestScoreUpdatePage
