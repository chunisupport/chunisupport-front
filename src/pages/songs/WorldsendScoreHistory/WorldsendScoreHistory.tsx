import { useLocation, useNavigate, useParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { createMemo, createResource, Show } from 'solid-js'
import { fetchOwnWorldsendScoreHistory, fetchWorldsendSongByDisplayId } from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import { WORLDSEND_SCORE_LABEL } from '../../../constants/chart'
import {
  buildAdminWorldsendChartRankingPath,
  buildWorldsendSongDetailPath,
  isChartDetailFromSongDetailState,
} from '../../../constants/routes'
import { joinDocumentTitleParts } from '../../../constants/site'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { worldsendFriendRankingQueryOptions } from '../../../queries/friendRankings'
import { authSession } from '../../../stores/authSession'
import { isNotFoundOrInvalidDisplayIdApiError } from '../../../utils/apiError'
import NotFoundPage from '../../NotFoundPage'
import ChartDetailPage from '../components/chartDetail/ChartDetailPage'
import { CHART_DETAIL_PAGE_TITLE } from '../components/chartDetail/constants'
import WorldsendBadge from '../components/WorldsendBadge'

/**
 * ログインユーザーの WORLD'S END 譜面詳細を表示する。
 *
 * @returns スコア履歴グラフとフレンドランキングを表示する画面。
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
  const friendRanking = useQuery(() =>
    worldsendFriendRankingQueryOptions(authSession.user?.username ?? null, params.displayid)
  )
  useDocumentTitle(() =>
    joinDocumentTitleParts(song()?.title ?? WORLDSEND_SCORE_LABEL, CHART_DETAIL_PAGE_TITLE)
  )
  /** 存在しない・形式不正の表示IDは存在しない曲とみなして404表示にする */
  const isSongNotFound = createMemo(() => isNotFoundOrInvalidDisplayIdApiError(song.error))

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

    navigate(buildWorldsendSongDetailPath(params.displayid))
  }

  return (
    <Show
      when={!song.error}
      fallback={
        <Show when={isSongNotFound()} fallback={<LoadError error={song.error} />}>
          <NotFoundPage />
        </Show>
      }
    >
      <Show when={!song.loading} fallback={<Loading />}>
        <ChartDetailPage
          title={song()?.title ?? '-'}
          artist={song()?.artist || '-'}
          badge={<WorldsendBadge />}
          onBack={handleSongDetailReturn}
          historyEntries={history()?.entries ?? []}
          isHistoryLoading={history.loading}
          historyError={history.error}
          friendRankingEntries={friendRanking.data?.ranking ?? []}
          isFriendRankingLoading={friendRanking.isLoading}
          friendRankingError={friendRanking.error}
          adminRankingHref={buildAdminWorldsendChartRankingPath(params.displayid)}
        />
      </Show>
    </Show>
  )
}

export default WorldsendScoreHistory
