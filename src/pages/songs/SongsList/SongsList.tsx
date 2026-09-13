import { ArrowUpDown } from 'lucide-solid'
import { createMemo, createSignal, ErrorBoundary, Show } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import { AppIconButton } from '../../../components/common/AppButton'
import { useAppMainScrollRestoration } from '../../../hooks/useAppMainScrollRestoration'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { SortDirection } from '../../../utils/sortingQuery'
import SongFilterPanel from '../components/SongFilterPanel'
import SongSearchInput from '../components/SongSearchInput'
import SongsViewToggle from '../components/SongsViewToggle'
import { useSongsListQuery } from '../useSongsListQuery'
import SongsTable from './components/SongsTable'
import { SONG_CHART_DISPLAY_LABELS, type SongChartDisplayMode } from './constants'
import { nextSortState, type SongSortKey, sortSongs } from './utils/sorting'

/**
 * 通常楽曲の一覧画面を表示する。
 *
 * @returns 楽曲一覧ページ。
 */
const SongsList = () => {
  const {
    isSongsLoading,
    loadError,
    genres,
    versionOptions,
    genreFilterOptions,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    filteredSongs,
  } = useSongsListQuery()
  const [sortKey, setSortKey] = createSignal<SongSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const [displayMode, setDisplayMode] = createSignal<SongChartDisplayMode>('const')

  const restoredScrollOffset = useAppMainScrollRestoration(() => !isSongsLoading())

  const sortedSongs = createMemo(() =>
    sortSongs(filteredSongs(), sortKey(), sortDirection(), genres(), displayMode())
  )

  const handleSortChange = (nextKey: SongSortKey) => {
    const nextSort = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(nextSort.sortKey)
    setSortDirection(nextSort.sortDirection)
  }

  useDocumentTitle('楽曲一覧')

  return (
    <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
      <Show when={!loadError()} fallback={<LoadError error={loadError()} />}>
        <Show when={!isSongsLoading()} fallback={<Loading />}>
          <div class="mx-auto w-full max-w-full space-y-4 p-4">
            <div class="flex items-center justify-between">
              <h1 class="text-2xl font-semibold">楽曲一覧</h1>
              <SongsViewToggle />
            </div>
            <div class="flex max-w-md items-end">
              <SongSearchInput id="songs-search" value={searchQuery()} onInput={setSearchQuery} />
              <SongFilterPanel
                idPrefix="songs"
                filters={filters()}
                onChange={setFilters}
                genres={genreFilterOptions()}
                versions={versionOptions()}
              />
              <AppIconButton
                class="ml-2 h-9.5 w-9.5 shrink-0"
                tone={displayMode() === 'notes' ? 'primary' : 'surface'}
                aria-label={SONG_CHART_DISPLAY_LABELS.toggle}
                aria-pressed={displayMode() === 'notes'}
                title={
                  displayMode() === 'const'
                    ? SONG_CHART_DISPLAY_LABELS.toNotes
                    : SONG_CHART_DISPLAY_LABELS.toConst
                }
                onClick={() => setDisplayMode((mode) => (mode === 'const' ? 'notes' : 'const'))}
              >
                <ArrowUpDown size={24} aria-hidden="true" />
              </AppIconButton>
            </div>
            <p class="text-sm text-text-muted">{sortedSongs().length}件</p>

            <SongsTable
              songs={sortedSongs()}
              displayMode={displayMode()}
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

export default SongsList
