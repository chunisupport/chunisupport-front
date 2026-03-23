import { useNavigate, useParams } from '@solidjs/router'
import { createResource, ErrorBoundary, Show } from 'solid-js'
import { fetchWorldsendSongByDisplayId } from '../../../api/songs'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { getWorldsendTitleMeta } from '../worldsendDetailModel'
import WorldsendChartCard from './components/WorldsendChartCard'
import WorldsendSongInfoCard from './components/WorldsendSongInfoCard'

const WorldsendSongDetail = () => {
  const params = useParams<{ displayid: string }>()
  const navigate = useNavigate()

  const [song] = createResource(() => params.displayid, fetchWorldsendSongByDisplayId)

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
      <Show when={!song.loading && song()} fallback={<Loading />}>
        {(songData) => {
          const currentSong = songData()
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
              <WorldsendChartCard song={currentSong} />
            </div>
          )
        }}
      </Show>
    </ErrorBoundary>
  )
}

export default WorldsendSongDetail
