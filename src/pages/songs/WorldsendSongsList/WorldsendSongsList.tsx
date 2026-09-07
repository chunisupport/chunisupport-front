import { createMemo, createResource, createSignal, ErrorBoundary, onMount, Show } from 'solid-js'
import { fetchMasterData, fetchVersions } from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import { useAppMainScrollRestoration } from '../../../hooks/useAppMainScrollRestoration'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { sortSongsByReleaseDescAndIdxDesc, useSongsData } from '../../../stores/songsData'
import type { SortDirection } from '../../../utils/sortingQuery'
import SongFilterPanel from '../components/SongFilterPanel'
import SongSearchInput from '../components/SongSearchInput'
import SongsViewToggle from '../components/SongsViewToggle'
import { buildSearchableItems, filterSearchableItems } from '../searchHelpers'
import { createSongFilters, filterSongs } from '../songFilters'
import WorldsendSongsTable from './components/WorldsendSongsTable'
import { nextSortState, sortWorldsendSongs, type WorldsendSongSortKey } from './utils/sorting'

/**
 * WORLD'S END 楽曲の一覧画面を表示する。
 *
 * @returns WORLD'S END 楽曲一覧ページ。
 */
const WorldsendSongsList = () => {
  const { worldsendSongsResponse, ensureWorldsendSongsLoaded, isWorldsendSongsLoading } =
    useSongsData()
  const [masterData] = createResource(fetchMasterData)
  const [versions] = createResource(fetchVersions)
  const [filters, setFilters] = createSignal(createSongFilters())
  const [sortKey, setSortKey] = createSignal<WorldsendSongSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const [searchQuery, setSearchQuery] = createSignal('')

  onMount(() => {
    ensureWorldsendSongsLoaded()
  })

  const restoredScrollOffset = useAppMainScrollRestoration(() => !isWorldsendSongsLoading())

  const defaultSortedSongs = createMemo(() => {
    const songs = worldsendSongsResponse()?.songs ?? []
    return sortSongsByReleaseDescAndIdxDesc(songs)
  })

  const searchableSongs = createMemo(() => buildSearchableItems(defaultSortedSongs()))

  const filteredSongs = createMemo(() =>
    filterSongs(
      filterSearchableItems(searchableSongs(), searchQuery()),
      filters(),
      versions()?.versions ?? []
    )
  )

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
        when={!worldsendSongsResponse.error && !masterData.error && !versions.error}
        fallback={
          <LoadError error={worldsendSongsResponse.error ?? masterData.error ?? versions.error} />
        }
      >
        <Show when={!isWorldsendSongsLoading()} fallback={<Loading />}>
          <div class="mx-auto w-full max-w-full p-4 space-y-4">
            <div class="flex items-center justify-between">
              <h1 class="text-2xl font-semibold">WORLD&apos;S END 楽曲一覧</h1>
              <SongsViewToggle />
            </div>
            <div class="flex max-w-md items-end">
              <SongSearchInput
                id="worldsend-songs-search"
                value={searchQuery()}
                onInput={setSearchQuery}
              />
              <SongFilterPanel
                filters={filters()}
                onChange={setFilters}
                genres={[
                  ...new Set(
                    defaultSortedSongs()
                      .map((song) => song.genre)
                      .filter((genre) => genre !== null)
                  ),
                ]}
                versions={versions()?.versions ?? []}
              />
            </div>
            <p class="text-sm text-text-muted">{sortedSongs().length}件</p>

            <WorldsendSongsTable
              songs={sortedSongs()}
              sortKey={sortKey()}
              sortDirection={sortDirection()}
              initialScrollOffset={restoredScrollOffset}
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
