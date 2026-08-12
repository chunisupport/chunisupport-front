import { A, useParams } from '@solidjs/router'
import { ArrowLeft } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createMemo, createResource, ErrorBoundary, Show } from 'solid-js'
import { fetchUserProfileSummary, fetchUserRatingOpHistory } from '../../../api/users'
import { LoadError, Loading, PlayerDataEmptyState } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type {
  PlayerMetricHistoryEntryDTO,
  PlayerMetricHistoryResponseDTO,
  UserProfileDTO,
} from '../../../types/api'
import { isNotFoundApiError } from '../../../utils/apiError'
import { isPlayerMetricHistoryNotFoundError } from '../../../utils/playerMetricHistory'
import { buildUserProfilePagePath } from '../../../utils/userProfileRoute'
import NotFoundPage from '../../NotFoundPage'
import { PLAYER_METRIC_HISTORY_COPY } from './constants'
import { RatingOpHistoryChart } from './RatingOpHistoryChart'
import { RatingOpHistoryTable } from './RatingOpHistoryTable'

type UserStatsPageLoadState =
  | {
      type: 'loaded'
      username: string
      profile: UserProfileDTO
      entries: PlayerMetricHistoryEntryDTO[]
    }
  | {
      type: 'notFound'
      username: string
    }
  | {
      type: 'error'
      username: string
      error: unknown
    }

/**
 * 公式指標履歴APIを取得し、履歴未作成を空配列へ変換する。
 *
 * @param username - 履歴を取得する公開ユーザー名。
 * @returns 公式指標履歴。履歴がまだ存在しない場合は空配列。
 */
const fetchMetricHistory = async (username: string): Promise<PlayerMetricHistoryResponseDTO> => {
  try {
    return await fetchUserRatingOpHistory(username)
  } catch (error) {
    if (isPlayerMetricHistoryNotFoundError(error)) {
      return { entries: [] }
    }

    throw error
  }
}

/**
 * 公開プロフィールの存在と公式指標履歴を順に取得する。
 *
 * @param username - 表示対象の公開ユーザー名。
 * @returns ページ表示、未検出、取得失敗のいずれかの状態。
 */
const fetchUserStatsPageLoadState = async (username: string): Promise<UserStatsPageLoadState> => {
  try {
    const profile = await fetchUserProfileSummary(username)
    if (!profile.player) {
      return { type: 'loaded', username, profile, entries: [] }
    }

    const history = await fetchMetricHistory(username)
    return { type: 'loaded', username, profile, entries: history.entries }
  } catch (error) {
    return isNotFoundApiError(error)
      ? { type: 'notFound', username }
      : { type: 'error', username, error }
  }
}

/**
 * 公開ユーザーの公式RATINGと公式OVER POWER履歴を表示する。
 *
 * @returns 2枚の履歴グラフと同データの履歴表を含むページ。
 */
const UserStatsPage: Component = () => {
  const params = useParams<{ username: string }>()
  const [pageState] = createResource(() => params.username, fetchUserStatsPageLoadState)
  const currentState = createMemo(() => {
    if (pageState.loading) return undefined

    const state = pageState()
    return state?.username === params.username ? state : undefined
  })
  const loadedState = createMemo(() => {
    const state = currentState()
    return state?.type === 'loaded' ? state : undefined
  })
  const errorState = createMemo(() => {
    const state = currentState()
    return state?.type === 'error' ? state : undefined
  })
  const isNotFound = createMemo(() => currentState()?.type === 'notFound')

  useDocumentTitle(() => `${params.username}さんの${PLAYER_METRIC_HISTORY_COPY.documentTitle}`)

  return (
    <ErrorBoundary
      fallback={(error) => (
        <div class="mx-auto w-full max-w-5xl p-4">
          <LoadError error={error} />
        </div>
      )}
    >
      <Show when={!isNotFound()} fallback={<NotFoundPage />}>
        <Show
          when={!errorState()}
          fallback={
            <div class="mx-auto w-full max-w-5xl p-4">
              <LoadError error={errorState()?.error} />
            </div>
          }
        >
          <Show when={loadedState()} fallback={<Loading />}>
            {(state) => (
              <Show when={state().profile.player} fallback={<PlayerDataEmptyState />}>
                {(player) => (
                  <div class="mx-auto w-full max-w-5xl space-y-6 p-4">
                    <A
                      href={buildUserProfilePagePath(params.username, 'rating_best')}
                      class="inline-flex items-center gap-1 rounded text-sm text-action-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      <ArrowLeft class="h-4 w-4" aria-hidden="true" />
                      <span>{PLAYER_METRIC_HISTORY_COPY.backToProfile}</span>
                    </A>

                    <header class="space-y-2">
                      <h1 class="text-2xl font-semibold text-text">
                        {PLAYER_METRIC_HISTORY_COPY.pageTitle}
                      </h1>
                      <p class="font-sans text-sm text-text-muted">{player().name}</p>
                    </header>

                    <Show
                      when={state().entries.length > 0 ? state().entries : undefined}
                      fallback={
                        <section class="rounded-lg border border-border bg-surface px-4 py-10 text-center text-sm text-text-muted shadow-sm">
                          {PLAYER_METRIC_HISTORY_COPY.emptyHistory}
                        </section>
                      }
                    >
                      {(entries) => (
                        <>
                          <RatingOpHistoryChart entries={entries()} />
                          <RatingOpHistoryTable entries={entries()} />
                        </>
                      )}
                    </Show>
                  </div>
                )}
              </Show>
            )}
          </Show>
        </Show>
      </Show>
    </ErrorBoundary>
  )
}

export default UserStatsPage
