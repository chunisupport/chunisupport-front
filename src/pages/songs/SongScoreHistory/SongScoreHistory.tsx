import { Button } from '@kobalte/core/button'
import { A, useParams, useSearchParams } from '@solidjs/router'
import { createMemo, createResource, For, Show } from 'solid-js'
import { fetchOwnSongScoreHistory, fetchSongByDisplayId } from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import { DifficultyBadge } from '../../../components/common/DifficultyBadge'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { authSession } from '../../../stores/authSession'
import {
  formatScoreHistoryDateTime,
  parseScoreHistoryDifficulty,
} from '../../../utils/scoreHistory'
import NotFoundPage from '../../NotFoundPage'
import {
  CURRENT_BEST_LABEL,
  SCORE_HISTORY_PAGE_TITLE,
  SCORE_HISTORY_SCORE_LABEL,
  SCORE_HISTORY_UPDATED_AT_LABEL,
} from './constants'

/**
 * ログインユーザーの譜面別スコア履歴を表示する。
 *
 * @returns 現行ベストと過去のベストを新しい順に表示する画面。
 */
const SongScoreHistory = () => {
  const params = useParams<{ displayid: string }>()
  const [searchParams] = useSearchParams()
  const difficulty = createMemo(() => parseScoreHistoryDifficulty(searchParams.diff))
  const [song] = createResource(() => params.displayid, fetchSongByDisplayId)
  const [history] = createResource(
    () => {
      const username = authSession.user?.username
      const selectedDifficulty = difficulty()
      if (!username || !selectedDifficulty) return null
      return { displayId: params.displayid, difficulty: selectedDifficulty, username }
    },
    (source) => fetchOwnSongScoreHistory(source.displayId, source.difficulty, source.username)
  )

  const isValidChart = createMemo(() => {
    const currentSong = song()
    const selectedDifficulty = difficulty()
    return Boolean(currentSong && selectedDifficulty && currentSong.charts[selectedDifficulty])
  })

  useDocumentTitle(() => `${song()?.title ?? '楽曲'} - ${SCORE_HISTORY_PAGE_TITLE}`)

  return (
    <Show when={difficulty()} fallback={<NotFoundPage />}>
      <Show when={!song.error} fallback={<LoadError error={song.error} />}>
        <Show when={!song.loading} fallback={<Loading />}>
          <Show when={isValidChart()} fallback={<NotFoundPage />}>
            <main class="mx-auto w-full max-w-4xl space-y-4 p-4">
              <Button
                as={A}
                href={`/songs/${encodeURIComponent(params.displayid)}?diff=${difficulty()?.toLowerCase()}`}
                class="cursor-pointer border-0 bg-transparent p-0 text-sm text-action-primary hover:underline"
              >
                ← 楽曲詳細へ戻る
              </Button>

              <header class="space-y-2">
                <h1 class="text-2xl font-semibold">{SCORE_HISTORY_PAGE_TITLE}</h1>
                <div class="flex items-center gap-3">
                  <DifficultyBadge difficulty={difficulty() ?? 'MASTER'} />
                  <span class="font-semibold font-sans">{song()?.title}</span>
                </div>
              </header>

              <Show when={!history.error} fallback={<LoadError error={history.error} />}>
                <Show when={!history.loading} fallback={<Loading />}>
                  <div class="overflow-x-auto rounded-lg border border-border bg-surface">
                    <table class="w-full min-w-md border-collapse">
                      <thead class="bg-surface-muted text-left text-sm text-text-muted">
                        <tr>
                          <th scope="col" class="px-4 py-3">
                            {SCORE_HISTORY_UPDATED_AT_LABEL}
                          </th>
                          <th scope="col" class="px-4 py-3 text-right">
                            {SCORE_HISTORY_SCORE_LABEL}
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border">
                        <For each={history()?.entries ?? []}>
                          {(entry, index) => (
                            <tr>
                              <td class="px-4 py-3 text-sm">
                                <div class="flex items-center gap-2">
                                  <span>{formatScoreHistoryDateTime(entry.updated_at)}</span>
                                  <Show when={index() === 0}>
                                    <span class="rounded-full bg-success-bg px-2 py-0.5 text-xs font-semibold text-success-text">
                                      {CURRENT_BEST_LABEL}
                                    </span>
                                  </Show>
                                </div>
                              </td>
                              <td class="px-4 py-3 text-right font-oswald text-lg font-semibold tabular-nums">
                                {entry.score.toLocaleString('ja-JP')}
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </Show>
              </Show>
            </main>
          </Show>
        </Show>
      </Show>
    </Show>
  )
}

export default SongScoreHistory
