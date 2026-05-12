import { createMemo, createSignal, ErrorBoundary, onMount, Show } from 'solid-js'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { sortSongsByAddedDateAndOfficialIndex, useSongsData } from '../../../stores/songsData'
import { matchesSearchQuery } from '../../../utils/searchUtils'
import type { SortDirection } from '../../users/recordTable/sortingQuery'
import SongsViewToggle from '../components/SongsViewToggle'
import WorldsendSongsTable from './components/WorldsendSongsTable'
import { nextSortState, sortWorldsendSongs, type WorldsendSongSortKey } from './utils/sorting'

const WorldsendSongsList = () => {
  const { worldsendSongsResponse, ensureWorldsendSongsLoaded, isWorldsendSongsLoading } =
    useSongsData()
  const [sortKey, setSortKey] = createSignal<WorldsendSongSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const [searchQuery, setSearchQuery] = createSignal('')

  onMount(() => {
    ensureWorldsendSongsLoaded()
  })

  const defaultSortedSongs = createMemo(() => {
    const songs = worldsendSongsResponse()?.songs ?? []
    return sortSongsByAddedDateAndOfficialIndex(songs)
  })

  const filteredSongs = createMemo(() =>
    defaultSortedSongs().filter((song) =>
      matchesSearchQuery(song.title, song.artist, searchQuery())
    )
  )

  const sortedSongs = createMemo(() =>
    sortWorldsendSongs(filteredSongs(), sortKey(), sortDirection())
  )

  const handleSortChange = (nextKey: WorldsendSongSortKey) => {
    const nextSort = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(nextSort.sortKey)
    setSortDirection(nextSort.sortDirection)
  }

  useDocumentTitle("WORLD'S END 楽曲一覧")

  return (
    <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
      <Show when={!isWorldsendSongsLoading()} fallback={<Loading />}>
        <div class="mx-auto w-full max-w-[100%] p-4 space-y-4">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-semibold">WORLD&apos;S END 楽曲一覧</h1>
            <SongsViewToggle />
          </div>
          <div class="max-w-md">
            <label
              class="mb-1 block text-sm font-medium text-gray-700"
              for="worldsend-songs-search"
            >
              楽曲検索
            </label>
            <input
              id="worldsend-songs-search"
              type="search"
              value={searchQuery()}
              onInput={(event) => setSearchQuery(event.currentTarget.value)}
              placeholder="曲名・アーティスト名で検索"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <p class="text-sm text-gray-600">{sortedSongs().length}件</p>

          <WorldsendSongsTable
            songs={sortedSongs()}
            sortKey={sortKey()}
            sortDirection={sortDirection()}
            onSortChange={handleSortChange}
          />

          <Show when={sortedSongs().length === 0}>
            <p class="text-sm text-gray-500">表示できる楽曲がありません。</p>
          </Show>
        </div>
      </Show>
    </ErrorBoundary>
  )
}

export default WorldsendSongsList
