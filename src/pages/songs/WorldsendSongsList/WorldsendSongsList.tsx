import { createMemo, createResource, createSignal, ErrorBoundary, onMount, Show } from 'solid-js'
import { fetchMasterData } from '../../../api/songs.ts'
import { LoadError, Loading } from '../../../components/index.ts'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.ts'
import { sortSongsByReleaseDescAndIdxDesc, useSongsData } from '../../../stores/songsData.ts'
import type { SortDirection } from '../../users/recordTable/sortingQuery.ts'
import SongSearchInput from '../components/SongSearchInput.tsx'
import SongsViewToggle from '../components/SongsViewToggle.tsx'
import { buildSearchableItems, filterSearchableItems } from '../searchHelpers.ts'
import WorldsendSongsTable from './components/WorldsendSongsTable.tsx'
import { nextSortState, sortWorldsendSongs, type WorldsendSongSortKey } from './utils/sorting.ts'

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
    return sortSongsByReleaseDescAndIdxDesc(songs)
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
    <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
      <Show
        when={!worldsendSongsResponse.error && !masterData.error}
        fallback={<LoadError error={worldsendSongsResponse.error ?? masterData.error} />}
      >
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
      </Show>
    </ErrorBoundary>
  )
}

export default WorldsendSongsList
