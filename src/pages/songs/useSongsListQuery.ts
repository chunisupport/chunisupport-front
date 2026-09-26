import { createMemo, createResource, createSignal, onMount } from 'solid-js'
import { fetchMasterData, fetchVersions } from '../../api/songs'
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
  const [masterData] = createResource(fetchMasterData)
  const [versions] = createResource(fetchVersions)
  const [filters, setFilters] = createSignal<SongFilters>(createSongFilters())
  const [searchQuery, setSearchQuery] = createSignal('')

  onMount(() => {
    ensureSongsLoaded()
  })

  const loadError = createMemo(() => songsResponse.error ?? masterData.error ?? versions.error)

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
  const genres = createMemo(() => masterData()?.genres)

  return {
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
  }
}
