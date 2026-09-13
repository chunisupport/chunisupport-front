import { ArrowUpDown } from 'lucide-solid'
import { createMemo, createSignal, ErrorBoundary, Show } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import { AppIconButton } from '../../../components/common/AppButton'
import { useAppMainScrollRestoration } from '../../../hooks/useAppMainScrollRestoration'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { SortDirection } from '../../../utils/sortingQuery'
import SongFilterPanel from '../components/SongFilterPanel'
import SongListViewModeToggle from '../components/SongListViewModeToggle'
import SongSearchInput from '../components/SongSearchInput'
import SongsViewToggle from '../components/SongsViewToggle'
import { createSongCardLayout } from '../createSongCardLayout'
import SongCardSortControls from '../SongsCardList/components/SongCardSortControls'
import SongsCardGrid from '../SongsCardList/components/SongsCardGrid'
import { SONG_CARD_DEFAULT_SORT_OPTION_ID } from '../SongsCardList/constants'
import { findSongCardSortOption } from '../SongsCardList/utils/songCardSort'
import { songListViewMode } from '../songListViewMode'
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
  const [cardSortOptionId, setCardSortOptionId] = createSignal(SONG_CARD_DEFAULT_SORT_OPTION_ID)
  const [cardSortDirection, setCardSortDirection] = createSignal<SortDirection>('asc')
  const cardLayout = createSongCardLayout()

  const restoredScrollOffset = useAppMainScrollRestoration(() => !isSongsLoading())
  const isCardView = () => songListViewMode() === 'card'

  const tableSongs = createMemo(() =>
    sortSongs(filteredSongs(), sortKey(), sortDirection(), genres(), displayMode())
  )
  const cardSongs = createMemo(() => {
    const option = findSongCardSortOption(cardSortOptionId())
    return sortSongs(
      filteredSongs(),
      option.sortKey,
      option.sortKey ? cardSortDirection() : null,
      genres(),
      option.chartMetric
    )
  })

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
          <div ref={cardLayout.setFrameElement} class="w-full overflow-x-hidden p-4">
            <div
              class="mx-auto space-y-4"
              style={{ width: isCardView() ? `${cardLayout.contentWidth()}px` : '100%' }}
            >
              <div class="flex items-center justify-between">
                <h1 class="text-2xl font-semibold">楽曲一覧</h1>
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
                    id="songs-search"
                    value={searchQuery()}
                    onInput={setSearchQuery}
                  />
                  <SongFilterPanel
                    idPrefix="songs"
                    filters={filters()}
                    onChange={setFilters}
                    genres={genreFilterOptions()}
                    versions={versionOptions()}
                  />
                  <Show when={!isCardView()}>
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
                      onClick={() =>
                        setDisplayMode((mode) => (mode === 'const' ? 'notes' : 'const'))
                      }
                    >
                      <ArrowUpDown size={24} aria-hidden="true" />
                    </AppIconButton>
                  </Show>
                </div>
                <Show when={isCardView()}>
                  <SongCardSortControls
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
                  <SongsTable
                    songs={tableSongs()}
                    displayMode={displayMode()}
                    sortKey={sortKey()}
                    sortDirection={sortDirection()}
                    initialScrollOffset={restoredScrollOffset}
                    onSortChange={handleSortChange}
                  />
                }
              >
                <SongsCardGrid
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

export default SongsList
