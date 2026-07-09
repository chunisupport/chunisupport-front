import { Button } from '@kobalte/core/button'
import { A, useLocation, useNavigate, useParams } from '@solidjs/router'
import { createResource, type JSX, Show } from 'solid-js'
import { fetchOwnWorldsendScoreHistory, fetchWorldsendSongByDisplayId } from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import {
  buildWorldsendSongDetailPath,
  isScoreHistoryFromSongDetailState,
} from '../../../constants/routes'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { authSession } from '../../../stores/authSession'
import { WORLDSEND_SCORE_LABEL } from '../SongDetail/scoreHistory.constants'
import { SCORE_HISTORY_PAGE_TITLE } from '../SongScoreHistory/constants'
import ScoreHistoryTable from '../SongScoreHistory/ScoreHistoryTable'

/**
 * ログインユーザーの WORLD'S END スコア履歴を表示する。
 *
 * @returns 現行ベストと過去のベストを新しい順に表示する画面。
 */
const WorldsendScoreHistory = () => {
  const params = useParams<{ displayid: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [song] = createResource(() => params.displayid, fetchWorldsendSongByDisplayId)
  const [history] = createResource(
    () => {
      const username = authSession.user?.username
      return username ? { displayId: params.displayid, username } : null
    },
    (source) => fetchOwnWorldsendScoreHistory(source.displayId, source.username)
  )

  useDocumentTitle(() => `${song()?.title ?? WORLDSEND_SCORE_LABEL} - ${SCORE_HISTORY_PAGE_TITLE}`)

  /**
   * 楽曲詳細から入った履歴では詳細URLを積まず、元の詳細履歴へ戻す。
   *
   * @param event - 楽曲詳細へ戻るリンクのクリックイベント。
   * @returns なし。
   */
  const handleSongDetailReturn: JSX.EventHandler<HTMLAnchorElement, MouseEvent> = (event) => {
    if (!isScoreHistoryFromSongDetailState(location.state)) return

    event.preventDefault()
    navigate(-1)
  }

  return (
    <Show when={!song.error} fallback={<LoadError error={song.error} />}>
      <Show when={!song.loading} fallback={<Loading />}>
        <main class="mx-auto w-full max-w-4xl space-y-4 p-4">
          <Button
            as={A}
            href={buildWorldsendSongDetailPath(params.displayid)}
            onClick={handleSongDetailReturn}
            class="cursor-pointer border-0 bg-transparent p-0 text-sm text-action-primary hover:underline"
          >
            ← 楽曲詳細へ戻る
          </Button>

          <header class="space-y-2">
            <h1 class="text-2xl font-semibold">{SCORE_HISTORY_PAGE_TITLE}</h1>
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center justify-center rounded bg-[image:var(--cs-color-worldsend-label-bg)] px-3 py-1 text-center text-xs font-semibold tracking-wide whitespace-nowrap text-worldsend-label-text">
                {WORLDSEND_SCORE_LABEL}
              </span>
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
  )
}

export default WorldsendScoreHistory
