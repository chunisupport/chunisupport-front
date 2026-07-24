import { Button } from '@kobalte/core/button'
import { Star } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import type {
  MasterItemDTO,
  PlayerFavoriteSongResponseItem,
  SongDTO,
  VersionDTO,
} from '../../../../types/api'
import { sortMasterItemsBySortOrder } from '../../../../utils/masterData'
import {
  normalizeForReadingSearch,
  normalizeForSearch,
  normalizeQuery,
} from '../../../../utils/searchUtils'
import {
  getShortVersionName,
  resolveVersionNameByReleaseDate,
} from '../../../../utils/versionConverter'
import { createSongSelectionDialogModel } from '../../components/createSongSelectionDialogModel'
import { SongSelectionDialogBase } from '../../components/SongSelectionDialogBase'
import {
  buildDefaultSongSelectionFilter,
  getSongSelectionRowClass,
  hasSongSelectionFilterChanges,
  sortSongSelectionCandidates,
} from '../../components/songSelectionDialog'

type Props = {
  open: boolean
  songs: SongDTO[]
  genres: MasterItemDTO[]
  versions: VersionDTO[]
  favoriteSongs: PlayerFavoriteSongResponseItem[]
  onOpenChange: (open: boolean) => void
  onSave: (displayIds: string[]) => Promise<void>
}

const FAVORITE_SONG_LIMIT = 100
const FAVORITE_SONG_DESCRIPTION = `お気に入りは${FAVORITE_SONG_LIMIT}曲まで登録できます。`

/**
 * お気に入り楽曲を検索・絞り込みして編集するダイアログ。
 *
 * @param props - 楽曲、フィルター選択肢、現在値、保存処理。
 * @returns お気に入り楽曲設定UI。
 */
const FavoriteSongsDialog: Component<Props> = (props) => {
  const genreOptions = createMemo(() =>
    sortMasterItemsBySortOrder(props.genres).map((genre) => genre.name)
  )
  const versionOptions = createMemo(() =>
    props.versions.map((version) => getShortVersionName(version.name))
  )
  const defaultFilter = createMemo(() =>
    buildDefaultSongSelectionFilter(genreOptions(), versionOptions())
  )
  const originalIds = createMemo(() => new Set(props.favoriteSongs.map((item) => item.display_id)))
  const model = createSongSelectionDialogModel({
    open: () => props.open,
    selectedKeys: originalIds,
    defaultFilter,
    isFilterReady: (filter) => filter.genres.length > 0 && filter.versions.length > 0,
    save: (keys) => props.onSave(keys),
    onSaved: () => props.onOpenChange(false),
    saveErrorMessage: 'お気に入り楽曲設定の保存に失敗しました。',
    resetDraftOnError: true,
  })
  const filterChanged = createMemo(() =>
    hasSongSelectionFilterChanges(model.filters(), defaultFilter())
  )
  const songVersionById = createMemo(
    () =>
      new Map(
        props.songs.map((song) => [
          song.id,
          getShortVersionName(resolveVersionNameByReleaseDate(song.release, props.versions)),
        ])
      )
  )
  const searchableSongs = createMemo(() =>
    sortSongSelectionCandidates(props.songs).map((song) => ({
      song,
      searchableText: normalizeForSearch(`${song.id} ${song.title} ${song.artist}`),
      searchableReading: normalizeForReadingSearch(
        song.reading?.trim() ? song.reading : song.title
      ),
    }))
  )
  const filteredSongs = createMemo(() => {
    const { normalizedQuery, normalizedReadingQuery } = normalizeQuery(model.query())
    const currentFilters = model.filters()

    return searchableSongs()
      .filter(({ song, searchableText, searchableReading }) => {
        if (model.showSelectedOnly() && !model.draftKeys().has(song.id)) return false
        if (!currentFilters.genres.includes(song.genre)) return false
        if (!currentFilters.versions.includes(songVersionById().get(song.id) ?? '不明'))
          return false
        if (!normalizedQuery) return true
        return (
          searchableText.includes(normalizedQuery) ||
          searchableReading.includes(normalizedReadingQuery)
        )
      })
      .map(({ song }) => song)
  })
  const selectionSummary = createMemo(
    () =>
      `${model.selectedCount()} / ${FAVORITE_SONG_LIMIT}曲選択中・${filteredSongs().length}曲表示`
  )

  /**
   * お気に入り候補の選択行を描画する。
   *
   * @param song - 描画対象の楽曲。
   * @returns お気に入り選択ボタン。
   */
  const renderSong = (song: SongDTO): JSX.Element => {
    const selected = (): boolean => model.draftKeys().has(song.id)
    const limitReached = (): boolean => !selected() && model.selectedCount() >= FAVORITE_SONG_LIMIT

    return (
      <Button
        type="button"
        class={`flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60 ${getSongSelectionRowClass(
          selected()
        )}`}
        aria-pressed={selected()}
        aria-label={`${song.title}のお気に入り設定を切り替え`}
        title={limitReached() ? `お気に入りは${FAVORITE_SONG_LIMIT}曲までです` : undefined}
        disabled={model.isSaving() || limitReached()}
        onClick={() => model.toggleDraftKey(song.id, FAVORITE_SONG_LIMIT)}
      >
        <div class="min-w-0">
          <p class="truncate font-sans text-sm font-medium">{song.title}</p>
          <p
            class={`truncate font-sans text-xs ${
              selected() ? 'text-text-inverse/80' : 'text-text-subtle'
            }`}
          >
            {song.artist}
          </p>
        </div>
        <span
          class={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            selected() ? 'bg-surface/20 opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          <Star class="h-4 w-4 fill-current" />
        </span>
      </Button>
    )
  }

  return (
    <SongSelectionDialogBase
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="お気に入り楽曲設定"
      description={FAVORITE_SONG_DESCRIPTION}
      searchAriaLabel="お気に入り楽曲検索"
      query={model.query}
      setQuery={model.setQuery}
      filterDialogOpen={model.filterDialogOpen}
      setFilterDialogOpen={model.setFilterDialogOpen}
      filterChanged={filterChanged}
      showSelectedOnly={model.showSelectedOnly}
      setShowSelectedOnly={model.setShowSelectedOnly}
      selectionSummary={selectionSummary}
      announceSelectionSummary={true}
      items={filteredSongs}
      isListReady={model.isListReady}
      isSaving={model.isSaving}
      saveError={model.saveError}
      hasChanges={model.hasChanges}
      genres={genreOptions}
      versions={versionOptions}
      filters={model.filters}
      selectedGenres={(filter) => filter.genres}
      selectedVersions={(filter) => filter.versions}
      setGenres={(genres) => model.setFilters((current) => ({ ...current, genres }))}
      setVersions={(versions) => model.setFilters((current) => ({ ...current, versions }))}
      resetFilters={model.resetFilters}
      renderItem={renderSong}
      onSave={model.save}
    />
  )
}

export default FavoriteSongsDialog
