import { createMemo, createResource, createSignal, ErrorBoundary, onMount, Show } from 'solid-js'
import { fetchMasterData } from '../../../api/songs'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { sortSongsByAddedDateAndOfficialIndex, useSongsData } from '../../../stores/songsData'
import type { SortDirection } from '../../users/recordTable/sortingQuery'
import SongSearchInput from '../components/SongSearchInput'
import SongsViewToggle from '../components/SongsViewToggle'
import { buildSearchableItems, filterSearchableItems } from '../searchHelpers'
import WorldsendSongsTable from './components/WorldsendSongsTable'
import { nextSortState, sortWorldsendSongs, type WorldsendSongSortKey } from './utils/sorting'

const WorldsendSongsList = () => {
  const { worldsendSongsResponse, ensureWorldsendSongsLoaded, isWorldsendSongsLoading } =
    useSongsData()
  const [masterData] = createResource(fetchMasterData)
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

  const searchableSongs = createMemo(() => buildSearchableItems(defaultSortedSongs()))

  const filteredSongs = createMemo(() => filterSearchableItems(searchableSongs(), searchQuery()))

  const sortedSongs = createMemo(() =>
    sortWorldsendSongs(filteredSongs(), sortKey(), sortDirection(), masterData()?.genres)
  )

  const handleSortChange = (nextKey: WorldsendSongSortKey) => {
    const nextSort = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(nextSort.sortKey)
    setSortDirection(nextSort.sortDirection)
  }

  useDocumentTitle("WORLD'S END 楽曲一覧")

  return (
    <ErrorBoundary fallback={(err) => <p class="text-danger">ERROR: {err.message}</p>}>
      <Show when={!isWorldsendSongsLoading()} fallback={<Loading />}>
        <div class="mx-auto w-full max-w-[100%] p-4 space-y-4">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-semibold">WORLD&apos;S END 楽曲一覧</h1>
            <SongsViewToggle />
          </div>
          <SongSearchInput
            id="worldsend-songs-search"
            value={searchQuery()}
            onInput={setSearchQuery}
          />
          <p class="text-sm text-text-muted">{sortedSongs().length}件</p>

          <WorldsendSongsTable
            songs={sortedSongs()}
            sortKey={sortKey()}
            sortDirection={sortDirection()}
            onSortChange={handleSortChange}
          />

          <Show when={sortedSongs().length === 0}>
            <p class="text-sm text-text-subtle">表示できる楽曲がありません。</p>
          </Show>
        </div>
      </Show>
    </ErrorBoundary>
  )
}

export default WorldsendSongsList
