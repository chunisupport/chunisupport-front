import { useParams } from '@solidjs/router'
import { createMemo, createResource, Show } from 'solid-js'
import { fetchSongStats, fetchWorldsendSongByDisplayId } from '../../../api/songs.ts'
import { LoadError } from '../../../components/index.ts'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.ts'
import { authSession } from '../../../stores/authSession.ts'
import type { WorldsendSongDTO } from '../../../types/api.ts'
import { fetchUserRatingWithCache } from '../../../usecases/cache/fetchUserRatingWithCache.ts'
import { isNotFoundApiError } from '../../../utils/apiError.ts'
import NotFoundPage from '../../NotFoundPage.tsx'
import SongDetailLayout from '../components/SongDetailLayout.tsx'
import { useSongDetailBase } from '../components/useSongDetailBase.ts'
import SongStatsTabs from '../SongDetail/components/SongStatsTabs.tsx'
import { getWorldsendTitleMeta } from '../worldsendDetailModel.ts'
import WorldsendSongInfoCard from './components/WorldsendSongInfoCard.tsx'
import { getWorldsendDisplayIdSource } from './worldsendRouteParams.ts'

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
  const ownBestAverage = createMemo(() => ownRating()?.best_average)

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
          renderStats={() => (
            <>
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
