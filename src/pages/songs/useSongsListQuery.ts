import { createMemo, createResource, createSignal, onMount } from 'solid-js'
import { fetchGenres } from '../../api/genres'
import { fetchNameFolders } from '../../api/nameFolders'
import { fetchVersions } from '../../api/songs'
import { sortSongsByReleaseDescAndIdxDesc, useSongsData } from '../../stores/songsData'
import { buildSearchableItems, filterSearchableItems } from '../../utils/searchHelpers'
import { createSongFilters, filterSongs, type SongFilters } from './songFilters'

/**
 * 通常楽曲一覧の検索・属性フィルタと、ソート前の絞り込み結果を共有する。
 *
 * @returns 読み込み状態、フィルタ状態、絞り込み済み楽曲。
 */
export const useSongsListQuery = () => {
  const { songsResponse, ensureSongsLoaded, isSongsLoading } = useSongsData()
  const [genres] = createResource(fetchGenres)
  const [versions] = createResource(fetchVersions)
  const [nameFolders] = createResource(fetchNameFolders)
  const [filters, setFilters] = createSignal<SongFilters>(createSongFilters())
  const [searchQuery, setSearchQuery] = createSignal('')

  onMount(() => {
    ensureSongsLoaded()
  })

  const loadError = createMemo(() => songsResponse.error ?? genres.error ?? versions.error)

  const defaultSortedSongs = createMemo(() => {
    const songs = songsResponse()?.songs ?? []
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

  const genreFilterOptions = createMemo(() => [
    ...new Set(defaultSortedSongs().map((song) => song.genre)),
  ])

  const versionOptions = createMemo(() => versions()?.versions ?? [])
  const nameFolderOptions = createMemo(() => nameFolders() ?? [])

  return {
    isSongsLoading,
    loadError,
    genres,
    versionOptions,
    nameFolderOptions,
    genreFilterOptions,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    filteredSongs,
  }
}
