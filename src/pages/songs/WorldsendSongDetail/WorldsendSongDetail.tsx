import { useParams } from '@solidjs/router'
import { createMemo, createResource, Show } from 'solid-js'
import { fetchSongStats, fetchWorldsendSongByDisplayId } from '../../../api/songs'
import { LoadError } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { authSession } from '../../../stores/authSession'
import type { WorldsendSongDTO } from '../../../types/api'
import { fetchUserRatingWithCache } from '../../../usecases/cache/fetchUserRatingWithCache'
import { fetchUserRecordWithCache } from '../../../usecases/cache/fetchUserRecordWithCache'
import { isNotFoundApiError } from '../../../utils/apiError'
import NotFoundPage from '../../NotFoundPage'
import SongDetailLayout from '../components/SongDetailLayout'
import { useSongDetailBase } from '../components/useSongDetailBase'
import OwnScoreCard, { type OwnScoreItem } from '../SongDetail/components/OwnScoreCard'
import SongStatsTabs from '../SongDetail/components/SongStatsTabs'
import { WORLDSEND_SCORE_LABEL } from '../SongDetail/scoreHistory.constants'
import { getWorldsendTitleMeta } from '../worldsendDetailModel'
import WorldsendSongInfoCard from './components/WorldsendSongInfoCard'
import { getWorldsendDisplayIdSource } from './worldsendRouteParams'

const worldsendDifficulty = [{ label: "WORLD'S END", value: 'worldsend' }]

type WorldsendSongDetailLoadState =
  | {
      type: 'loaded'
      song: WorldsendSongDTO
    }
  | {
      type: 'notFound'
    }
  | {
      type: 'error'
      error: unknown
    }

/**
 * WORLD'S END楽曲詳細の初期表示に必要な楽曲情報を取得する。
 *
 * @param displayId - 表示対象の楽曲表示ID。
 * @returns WORLD'S END楽曲詳細の初期表示状態。
 */
const fetchWorldsendSongDetailLoadState = async (
  displayId: string
): Promise<WorldsendSongDetailLoadState> => {
  try {
    return { type: 'loaded', song: await fetchWorldsendSongByDisplayId(displayId) }
  } catch (error) {
    if (isNotFoundApiError(error)) {
      return { type: 'notFound' }
    }

    return { type: 'error', error }
  }
}

const WorldsendSongDetail = () => {
  const params = useParams<{ displayid: string }>()

  const displayIdSource = () => getWorldsendDisplayIdSource(params.displayid)

  const [songState] = createResource(displayIdSource, fetchWorldsendSongDetailLoadState)
  const song = createMemo(() => {
    const state = songState()
    return state?.type === 'loaded' ? state.song : undefined
  })
  const songLoadError = createMemo(() => {
    const state = songState()
    return state?.type === 'error' ? state.error : undefined
  })
  const { masterData, songVersionName, handleBack } = useSongDetailBase(() => song())
  const [stats] = createResource(displayIdSource, (displayId) =>
    fetchSongStats(displayId, worldsendDifficulty[0].value)
  )
  const [ownRating] = createResource(
    () => (authSession.status === 'authenticated' ? authSession.user?.username : null),
    fetchUserRatingWithCache
  )
  const [ownRecords] = createResource(
    () => (authSession.status === 'authenticated' ? authSession.user?.username : null),
    fetchUserRecordWithCache
  )
  const ownBestAverage = createMemo(() => ownRating()?.best_average)
  /** 表示中の楽曲に対応するログインユーザーの WORLD'S END レコードを取得する。 */
  const ownRecord = createMemo(() =>
    ownRecords()?.worldsend?.find((record) => record.id === song()?.id)
  )
  /** WORLD'S END の自己スコアカード表示項目を構築する。 */
  const ownScoreItems = createMemo<OwnScoreItem[]>(() => [
    {
      difficulty: WORLDSEND_SCORE_LABEL,
      score: ownRecord()?.is_played ? ownRecord()?.score : undefined,
      supportsHistory: false,
    },
  ])
  /** 統計表との比較に使うログインユーザーのプレイ済みスコアを取得する。 */
  const ownScore = createMemo(() =>
    authSession.status === 'authenticated' && ownRecord()?.is_played
      ? ownRecord()?.score
      : undefined
  )

  const titleMeta = createMemo(() => {
    const currentSong = song()
    if (!currentSong) return { title: '-', artist: '-' }
    return getWorldsendTitleMeta(currentSong)
  })

  useDocumentTitle(() => `${song()?.title ?? "WORLD'S END楽曲"} - WORLD'S END楽曲詳細`)

  return (
    <Show when={songState()?.type !== 'notFound'} fallback={<NotFoundPage />}>
      <Show when={!songLoadError()} fallback={<LoadError error={songLoadError()} />}>
        <SongDetailLayout
          song={song()}
          isSongLoading={songState.loading}
          title={titleMeta().title}
          artist={titleMeta().artist}
          onBack={handleBack}
          renderInfoCard={(currentSong) => (
            <WorldsendSongInfoCard song={currentSong} versionName={songVersionName()} />
          )}
          renderStats={(currentSong) => (
            <>
              <Show when={authSession.status === 'authenticated'}>
                <OwnScoreCard
                  displayId={currentSong.id}
                  items={ownScoreItems()}
                  loading={ownRecords.loading}
                />
              </Show>
              <Show when={stats.error} keyed>
                {(err) => <LoadError error={err} />}
              </Show>
              <Show when={!stats.error}>
                <SongStatsTabs
                  difficulties={worldsendDifficulty}
                  readonlyDifficulty={worldsendDifficulty[0].value}
                  stats={stats()}
                  isStatsLoading={stats.loading}
                  bestAverage={ownBestAverage()}
                  ratingBands={masterData()?.rating_bands}
                  ownScore={ownScore()}
                />
              </Show>
            </>
          )}
        />
      </Show>
    </Show>
  )
}

export default WorldsendSongDetail
