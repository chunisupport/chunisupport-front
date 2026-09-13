import { createMemo, createSignal, ErrorBoundary, Show } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import { useAppMainScrollRestoration } from '../../../hooks/useAppMainScrollRestoration'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { SortDirection } from '../../../utils/sortingQuery'
import SongFilterPanel from '../components/SongFilterPanel'
import SongSearchInput from '../components/SongSearchInput'
import { sortSongs } from '../SongsList/utils/sorting'
import { useSongsListQuery } from '../useSongsListQuery'
import SongCardSortControls from './components/SongCardSortControls'
import SongsCardGrid from './components/SongsCardGrid'
import { SONG_CARD_COPY, SONG_CARD_DEFAULT_SORT_OPTION_ID } from './constants'
import { findSongCardSortOption } from './utils/songCardSort'

/**
 * 通常楽曲のカード型一覧画面を表示する。
 *
 * @returns カード型楽曲一覧ページ。
 */
const SongsCardList = () => {
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
  const [sortOptionId, setSortOptionId] = createSignal(SONG_CARD_DEFAULT_SORT_OPTION_ID)
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('asc')

  const restoredScrollOffset = useAppMainScrollRestoration(() => !isSongsLoading())

  const sortedSongs = createMemo(() => {
    const option = findSongCardSortOption(sortOptionId())
    return sortSongs(
      filteredSongs(),
      option.sortKey,
      option.sortKey ? sortDirection() : null,
      genres(),
      option.chartMetric
    )
  })

  useDocumentTitle(SONG_CARD_COPY.pageTitle)

  return (
    <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
      <Show when={!loadError()} fallback={<LoadError error={loadError()} />}>
        <Show when={!isSongsLoading()} fallback={<Loading />}>
          <div class="mx-auto w-full max-w-full space-y-4 p-4">
            <h1 class="text-2xl font-semibold">{SONG_CARD_COPY.pageTitle}</h1>
            <div class="flex flex-wrap items-end gap-2">
              <div class="flex max-w-md min-w-0 flex-1 items-end">
                <SongSearchInput
                  id="songs-card-search"
                  value={searchQuery()}
                  onInput={setSearchQuery}
                />
                <SongFilterPanel
                  idPrefix="songs-card"
                  filters={filters()}
                  onChange={setFilters}
                  genres={genreFilterOptions()}
                  versions={versionOptions()}
                />
              </div>
              <SongCardSortControls
                sortOptionId={sortOptionId()}
                sortDirection={sortDirection()}
                onSortOptionChange={setSortOptionId}
                onSortDirectionChange={setSortDirection}
              />
            </div>
            <p class="text-sm text-text-muted">
              {sortedSongs().length}
              {SONG_CARD_COPY.countSuffix}
            </p>

            <SongsCardGrid songs={sortedSongs()} initialScrollOffset={restoredScrollOffset} />

            <Show when={sortedSongs().length === 0}>
              <p class="text-sm text-text-subtle">{SONG_CARD_COPY.empty}</p>
            </Show>
          </div>
        </Show>
      </Show>
    </ErrorBoundary>
  )
}

export default SongsCardList
