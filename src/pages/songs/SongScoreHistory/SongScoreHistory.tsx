import { Button } from '@kobalte/core/button'
import { useLocation, useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { createMemo, createResource, Show } from 'solid-js'
import {
  fetchOwnSongScoreHistory,
  fetchSongByDisplayId,
  fetchSongFriendRanking,
} from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import { DifficultyBadge } from '../../../components/common/DifficultyBadge'
import { buildSongDetailPath, isScoreHistoryFromSongDetailState } from '../../../constants/routes'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { authSession } from '../../../stores/authSession'
import { parseScoreHistoryDifficulty } from '../../../utils/scoreHistory'
import NotFoundPage from '../../NotFoundPage'
import {
  CHART_DETAIL_PAGE_TITLE,
  FRIEND_RANKING_SECTION_LABEL,
  SCORE_HISTORY_SECTION_LABEL,
} from './constants'
import FriendRankingTable from './FriendRankingTable'
import ScoreHistoryChart from './ScoreHistoryChart'
import ScoreHistoryTable from './ScoreHistoryTable'

/**
 * ログインユーザーの譜面詳細を表示する。
 *
 * @returns 対象譜面のスコア履歴とフレンドランキングを表示する画面。
 */
const SongScoreHistory = () => {
  const params = useParams<{ displayid: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const difficulty = createMemo(() => parseScoreHistoryDifficulty(searchParams.diff))
  const songDetailPath = createMemo(() =>
    buildSongDetailPath(params.displayid, difficulty() ?? undefined)
  )
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
  const [friendRanking] = createResource(
    () => {
      const selectedDifficulty = difficulty()
      if (!selectedDifficulty) return null
      return { displayId: params.displayid, difficulty: selectedDifficulty }
    },
    (source) => fetchSongFriendRanking(source.displayId, source.difficulty)
  )

  const isValidChart = createMemo(() => {
    const currentSong = song()
    const selectedDifficulty = difficulty()
    return Boolean(currentSong && selectedDifficulty && currentSong.charts[selectedDifficulty])
  })

  useDocumentTitle(() => `${song()?.title ?? '楽曲'} - ${CHART_DETAIL_PAGE_TITLE}`)

  /**
   * 楽曲詳細から入った履歴では詳細URLを積まず、元の詳細履歴へ戻す。
   *
   * @returns なし。
   */
  const handleSongDetailReturn = (): void => {
    if (isScoreHistoryFromSongDetailState(location.state)) {
      navigate(-1)
      return
    }

    navigate(songDetailPath())
  }

  return (
    <Show when={difficulty()} fallback={<NotFoundPage />}>
      <Show when={!song.error} fallback={<LoadError error={song.error} />}>
        <Show when={!song.loading} fallback={<Loading />}>
          <Show when={isValidChart()} fallback={<NotFoundPage />}>
            <main class="mx-auto w-full max-w-5xl space-y-6 p-4">
              <Button
                type="button"
                onClick={handleSongDetailReturn}
                class="cursor-pointer border-0 bg-transparent p-0 text-sm text-action-primary hover:underline"
              >
                ← 楽曲詳細へ戻る
              </Button>

              <header class="space-y-2">
                <h1 class="font-sans text-2xl font-semibold">{song()?.title}</h1>
                <div class="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                  <DifficultyBadge difficulty={difficulty() ?? 'MASTER'} />
                  <span>{song()?.artist || '-'}</span>
                </div>
              </header>

              <section class="space-y-4">
                <h2 class="text-lg font-semibold">{SCORE_HISTORY_SECTION_LABEL}</h2>
                <Show when={!history.error} fallback={<LoadError error={history.error} />}>
                  <Show when={!history.loading} fallback={<Loading />}>
                    <ScoreHistoryChart entries={history()?.entries ?? []} />
                    <ScoreHistoryTable entries={history()?.entries ?? []} />
                  </Show>
                </Show>
              </section>

              <section class="space-y-4">
                <h2 class="text-lg font-semibold">{FRIEND_RANKING_SECTION_LABEL}</h2>
                <Show
                  when={!friendRanking.error}
                  fallback={<LoadError error={friendRanking.error} />}
                >
                  <Show when={!friendRanking.loading} fallback={<Loading />}>
                    <FriendRankingTable entries={friendRanking()?.ranking ?? []} />
                  </Show>
                </Show>
              </section>
            </main>
          </Show>
        </Show>
      </Show>
    </Show>
  )
}

export default SongScoreHistory
