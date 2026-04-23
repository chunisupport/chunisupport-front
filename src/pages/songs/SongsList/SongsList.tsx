import { createMemo, ErrorBoundary, Show } from 'solid-js'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { sortSongsByTitle, useSongsData } from '../../../stores/songsData'
import SongsViewToggle from '../components/SongsViewToggle'
import SongsTable from './components/SongsTable'

const SongsList = () => {
  const { songsResponse } = useSongsData()

  const sortedSongs = createMemo(() => {
    const songs = songsResponse()?.songs ?? []
    return sortSongsByTitle(songs)
  })

  useDocumentTitle('楽曲一覧')

  return (
    <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
      <Show when={!songsResponse.loading} fallback={<Loading />}>
        <div class="mx-auto w-full max-w-[100%] p-4 space-y-4">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-semibold">楽曲一覧</h1>
            <SongsViewToggle />
          </div>
          <p class="text-sm text-gray-600">{sortedSongs().length}件</p>

          <SongsTable songs={sortedSongs()} />

          <Show when={sortedSongs().length === 0}>
            <p class="text-sm text-gray-500">表示できる楽曲がありません。</p>
          </Show>
        </div>
      </Show>
    </ErrorBoundary>
  )
}

export default SongsList
