import { Button } from '@kobalte/core/button'
import { A, useParams, useSearchParams } from '@solidjs/router'
import { createMemo, createResource, Show } from 'solid-js'
import { fetchOwnSongScoreHistory, fetchSongByDisplayId } from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import { DifficultyBadge } from '../../../components/common/DifficultyBadge'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { authSession } from '../../../stores/authSession'
import { parseScoreHistoryDifficulty } from '../../../utils/scoreHistory'
import NotFoundPage from '../../NotFoundPage'
import { SCORE_HISTORY_PAGE_TITLE } from './constants'
import ScoreHistoryTable from './ScoreHistoryTable'

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
                  <ScoreHistoryTable entries={history()?.entries ?? []} />
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
