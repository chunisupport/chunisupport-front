import { createMemo, createResource, createSignal, ErrorBoundary, onMount, Show } from 'solid-js'
import { fetchMasterData } from '../../../api/songs.ts'
import { LoadError, Loading } from '../../../components/index.ts'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.ts'
import { sortSongsByReleaseDescAndIdxDesc, useSongsData } from '../../../stores/songsData.ts'
import type { SortDirection } from '../../users/recordTable/sortingQuery.ts'
import SongSearchInput from '../components/SongSearchInput.tsx'
import SongsViewToggle from '../components/SongsViewToggle.tsx'
import { buildSearchableItems, filterSearchableItems } from '../searchHelpers.ts'
import SongsTable from './components/SongsTable.tsx'
import { nextSortState, type SongSortKey, sortSongs } from './utils/sorting.ts'

const SongsList = () => {
  const { songsResponse, ensureSongsLoaded, isSongsLoading } = useSongsData()
  const [masterData] = createResource(fetchMasterData)
  const [sortKey, setSortKey] = createSignal<SongSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const [searchQuery, setSearchQuery] = createSignal('')

  onMount(() => {
    ensureSongsLoaded()
  })

  const defaultSortedSongs = createMemo(() => {
    const songs = songsResponse()?.songs ?? []
    return sortSongsByReleaseDescAndIdxDesc(songs)
  })

  const searchableSongs = createMemo(() => buildSearchableItems(defaultSortedSongs()))

  const filteredSongs = createMemo(() => filterSearchableItems(searchableSongs(), searchQuery()))

  const sortedSongs = createMemo(() =>
    sortSongs(filteredSongs(), sortKey(), sortDirection(), masterData()?.genres)
  )

  const handleSortChange = (nextKey: SongSortKey) => {
    const nextSort = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(nextSort.sortKey)
    setSortDirection(nextSort.sortDirection)
  }

  useDocumentTitle('楽曲一覧')

  return (
    <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
      <Show
        when={!songsResponse.error && !masterData.error}
        fallback={<LoadError error={songsResponse.error ?? masterData.error} />}
      >
        <Show when={!isSongsLoading()} fallback={<Loading />}>
          <div class="mx-auto w-full max-w-[100%] p-4 space-y-4">
            <div class="flex items-center justify-between">
              <h1 class="text-2xl font-semibold">楽曲一覧</h1>
              <SongsViewToggle />
            </div>
            <SongSearchInput id="songs-search" value={searchQuery()} onInput={setSearchQuery} />
            <p class="text-sm text-text-muted">{sortedSongs().length}件</p>

            <SongsTable
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

export default SongsList
