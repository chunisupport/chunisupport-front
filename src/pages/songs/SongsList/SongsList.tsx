import { createMemo, createSignal, ErrorBoundary, onMount, Show } from 'solid-js'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { sortSongsByAddedDateAndOfficialIndex, useSongsData } from '../../../stores/songsData'
import { matchesNormalizedSearchQuery, normalizeForSearch } from '../../../utils/searchUtils'
import type { SortDirection } from '../../users/recordTable/sortingQuery'
import SongsViewToggle from '../components/SongsViewToggle'
import SongsTable from './components/SongsTable'
import { nextSortState, type SongSortKey, sortSongs } from './utils/sorting'

const SongsList = () => {
  const { songsResponse, ensureSongsLoaded, isSongsLoading } = useSongsData()
  const [sortKey, setSortKey] = createSignal<SongSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const [searchQuery, setSearchQuery] = createSignal('')

  onMount(() => {
    ensureSongsLoaded()
  })

  const defaultSortedSongs = createMemo(() => {
    const songs = songsResponse()?.songs ?? []
    return sortSongsByAddedDateAndOfficialIndex(songs)
  })

  const searchableSongs = createMemo(() =>
    defaultSortedSongs().map((song) => ({
      song,
      normalizedTitle: normalizeForSearch(song.title),
      normalizedArtist: normalizeForSearch(song.artist),
    }))
  )

  const normalizedQuery = createMemo(() => normalizeForSearch(searchQuery()))

  const filteredSongs = createMemo(() =>
    searchableSongs()
      .filter(({ normalizedTitle, normalizedArtist }) =>
        matchesNormalizedSearchQuery(normalizedTitle, normalizedArtist, normalizedQuery())
      )
      .map(({ song }) => song)
  )

  const sortedSongs = createMemo(() => sortSongs(filteredSongs(), sortKey(), sortDirection()))

  const handleSortChange = (nextKey: SongSortKey) => {
    const nextSort = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(nextSort.sortKey)
    setSortDirection(nextSort.sortDirection)
  }

  useDocumentTitle('楽曲一覧')

  return (
    <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
      <Show when={!isSongsLoading()} fallback={<Loading />}>
        <div class="mx-auto w-full max-w-[100%] p-4 space-y-4">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-semibold">楽曲一覧</h1>
            <SongsViewToggle />
          </div>
          <div class="max-w-md">
            <label class="mb-1 block text-sm font-medium text-gray-700" for="songs-search">
              楽曲検索
            </label>
            <input
              id="songs-search"
              type="search"
              value={searchQuery()}
              onInput={(event) => setSearchQuery(event.currentTarget.value)}
              placeholder="曲名・アーティスト名で検索"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <p class="text-sm text-gray-600">{sortedSongs().length}件</p>

          <SongsTable
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

export default SongsList
