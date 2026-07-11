import { useLocation, useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { createMemo, createResource, Show } from 'solid-js'
import {
  fetchOwnSongScoreHistory,
  fetchSongByDisplayId,
  fetchSongFriendRanking,
} from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import { DifficultyBadge } from '../../../components/common/DifficultyBadge'
import { buildSongDetailPath, isChartDetailFromSongDetailState } from '../../../constants/routes'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { authSession } from '../../../stores/authSession'
import { parseScoreHistoryDifficulty } from '../../../utils/scoreHistory'
import NotFoundPage from '../../NotFoundPage'
import ChartDetailPage from '../components/chartDetail/ChartDetailPage'
import { CHART_DETAIL_PAGE_TITLE } from '../components/chartDetail/constants'

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
    if (isChartDetailFromSongDetailState(location.state)) {
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
            <ChartDetailPage
              title={song()?.title ?? '-'}
              artist={song()?.artist || '-'}
              badge={<DifficultyBadge difficulty={difficulty() ?? 'MASTER'} />}
              onBack={handleSongDetailReturn}
              historyEntries={history()?.entries ?? []}
              isHistoryLoading={history.loading}
              historyError={history.error}
              friendRankingEntries={friendRanking()?.ranking ?? []}
              isFriendRankingLoading={friendRanking.loading}
              friendRankingError={friendRanking.error}
            />
          </Show>
        </Show>
      </Show>
    </Show>
  )
}

export default SongScoreHistory
