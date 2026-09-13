import { createMemo, createSignal, ErrorBoundary, Show } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import { useAppMainScrollRestoration } from '../../../hooks/useAppMainScrollRestoration'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { SortDirection } from '../../../utils/sortingQuery'
import SongFilterPanel from '../components/SongFilterPanel'
import SongListViewModeToggle from '../components/SongListViewModeToggle'
import SongSearchInput from '../components/SongSearchInput'
import SongsViewToggle from '../components/SongsViewToggle'
import { createSongCardLayout } from '../createSongCardLayout'
import { songListViewMode } from '../songListViewMode'
import { useWorldsendSongsListQuery } from '../useWorldsendSongsListQuery'
import WorldsendSongCardSortControls from '../WorldsendSongsCardList/components/WorldsendSongCardSortControls'
import WorldsendSongsCardGrid from '../WorldsendSongsCardList/components/WorldsendSongsCardGrid'
import { WORLDSEND_SONG_CARD_DEFAULT_SORT_OPTION_ID } from '../WorldsendSongsCardList/constants'
import { findWorldsendSongCardSortOption } from '../WorldsendSongsCardList/utils/worldsendSongCardSort'
import WorldsendSongsTable from './components/WorldsendSongsTable'
import { nextSortState, sortWorldsendSongs, type WorldsendSongSortKey } from './utils/sorting'

/**
 * WORLD'S END 楽曲の一覧画面を表示する。
 *
 * @returns WORLD'S END 楽曲一覧ページ。
 */
const WorldsendSongsList = () => {
  const {
    isWorldsendSongsLoading,
    loadError,
    genres,
    versionOptions,
    genreFilterOptions,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    filteredSongs,
  } = useWorldsendSongsListQuery()
  const [sortKey, setSortKey] = createSignal<WorldsendSongSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const [cardSortOptionId, setCardSortOptionId] = createSignal(
    WORLDSEND_SONG_CARD_DEFAULT_SORT_OPTION_ID
  )
  const [cardSortDirection, setCardSortDirection] = createSignal<SortDirection>('asc')
  const cardLayout = createSongCardLayout()

  const restoredScrollOffset = useAppMainScrollRestoration(() => !isWorldsendSongsLoading())
  const isCardView = () => songListViewMode() === 'card'

  const tableSongs = createMemo(() =>
    sortWorldsendSongs(filteredSongs(), sortKey(), sortDirection(), genres())
  )
  const cardSongs = createMemo(() => {
    const option = findWorldsendSongCardSortOption(cardSortOptionId())
    return sortWorldsendSongs(
      filteredSongs(),
      option.sortKey,
      option.sortKey ? cardSortDirection() : null,
      genres()
    )
  })

  const handleSortChange = (nextKey: WorldsendSongSortKey) => {
    const nextSort = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(nextSort.sortKey)
    setSortDirection(nextSort.sortDirection)
  }

  useDocumentTitle("WORLD'S END 楽曲一覧")

  return (
    <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
      <Show when={!loadError()} fallback={<LoadError error={loadError()} />}>
        <Show when={!isWorldsendSongsLoading()} fallback={<Loading />}>
          <div ref={cardLayout.setFrameElement} class="w-full overflow-x-hidden p-4">
            <div
              class="mx-auto space-y-4"
              style={{ width: isCardView() ? `${cardLayout.contentWidth()}px` : '100%' }}
            >
              <div class="flex items-center justify-between">
                <h1 class="text-2xl font-semibold">WORLD&apos;S END 楽曲一覧</h1>
                <div class="flex items-center gap-2">
                  <SongListViewModeToggle />
                  <SongsViewToggle />
                </div>
              </div>
              <div
                class="flex gap-2"
                classList={{
                  'flex-col': isCardView() && cardLayout.columnCount() === 1,
                  'flex-wrap items-end': isCardView() && cardLayout.columnCount() !== 1,
                }}
              >
                <div class="flex max-w-md min-w-0 flex-1 items-end">
                  <SongSearchInput
                    id="worldsend-songs-search"
                    value={searchQuery()}
                    onInput={setSearchQuery}
                  />
                  <SongFilterPanel
                    idPrefix="worldsend-songs"
                    filters={filters()}
                    onChange={setFilters}
                    genres={genreFilterOptions()}
                    versions={versionOptions()}
                  />
                </div>
                <Show when={isCardView()}>
                  <WorldsendSongCardSortControls
                    sortOptionId={cardSortOptionId()}
                    sortDirection={cardSortDirection()}
                    onSortOptionChange={setCardSortOptionId}
                    onSortDirectionChange={setCardSortDirection}
                  />
                </Show>
              </div>
              <p class="text-sm text-text-muted">{filteredSongs().length}件</p>

              <Show
                when={isCardView()}
                fallback={
                  <WorldsendSongsTable
                    songs={tableSongs()}
                    sortKey={sortKey()}
                    sortDirection={sortDirection()}
                    initialScrollOffset={restoredScrollOffset}
                    onSortChange={handleSortChange}
                  />
                }
              >
                <WorldsendSongsCardGrid
                  songs={cardSongs()}
                  versions={versionOptions()}
                  columnCount={cardLayout.columnCount()}
                  initialScrollOffset={restoredScrollOffset}
                />
              </Show>

              <Show when={filteredSongs().length === 0}>
                <p class="text-sm text-text-subtle">表示できる楽曲がありません。</p>
              </Show>
            </div>
          </div>
        </Show>
      </Show>
    </ErrorBoundary>
  )
}

export default WorldsendSongsList
