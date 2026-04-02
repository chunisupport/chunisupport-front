import { useNavigate, useParams } from '@solidjs/router'
import { createResource, ErrorBoundary, Show } from 'solid-js'
import { fetchMasterData, fetchSongStats, fetchWorldsendSongByDisplayId } from '../../../api/songs'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { getWorldsendTitleMeta } from '../worldsendDetailModel'
import SongStatsTabs from '../SongDetail/components/SongStatsTabs'
import WorldsendSongInfoCard from './components/WorldsendSongInfoCard'
import { getWorldsendDisplayIdSource } from './worldsendRouteParams'

const worldsendDifficulty = [{ label: "WORLD'S END", value: 'worldsend' }]

const WorldsendSongDetail = () => {
  const params = useParams<{ displayid: string }>()
  const navigate = useNavigate()

  const displayIdSource = () => getWorldsendDisplayIdSource(params.displayid)

  const [song] = createResource(displayIdSource, fetchWorldsendSongByDisplayId)
  const [masterData] = createResource(fetchMasterData)
  const [stats] = createResource(displayIdSource, (displayId) =>
    fetchSongStats(displayId, worldsendDifficulty[0].value)
  )

  useDocumentTitle(() => `${song()?.title ?? "WORLD'S END楽曲"} - WORLD'S END楽曲詳細`)

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/songs')
  }

  return (
    <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
      <Show
        when={song()}
        keyed
        fallback={
          <Show
            when={song.loading}
            fallback={<p class="text-red-500">ERROR: {song.error?.message}</p>}
          >
            <Loading />
          </Show>
        }
      >
        {(currentSong) => {
          const titleMeta = getWorldsendTitleMeta(currentSong)

          return (
            <div class="mx-auto w-full max-w-6xl space-y-4 p-4">
              <div class="text-sm">
                <button
                  type="button"
                  onClick={handleBack}
                  class="cursor-pointer border-0 bg-transparent p-0 text-primary-600 hover:underline"
                >
                  ← 戻る
                </button>
              </div>

              <div class="space-y-1">
                <p class="text-sm font-medium text-primary-700">WORLD'S END</p>
                <h1 class="mb-1 text-2xl font-semibold">{titleMeta.title}</h1>
                <div class="text-gray-600">{titleMeta.artist}</div>
              </div>

              <WorldsendSongInfoCard song={currentSong} />

              <Show when={stats.error} keyed>
                {(err) => <p class="text-red-500">Error loading stats: {err.message}</p>}
              </Show>
              <Show when={!stats.error}>
                <SongStatsTabs
                  difficulties={worldsendDifficulty}
                  selectedDifficulty={worldsendDifficulty[0].value}
                  onDifficultyChange={() => undefined}
                  ratingBands={masterData()?.rating_bands.map((band) => band.label) ?? []}
                  stats={stats()}
                  isStatsLoading={stats.loading}
                />
              </Show>
            </div>
          )
        }}
      </Show>
    </ErrorBoundary>
  )
}

export default WorldsendSongDetail
