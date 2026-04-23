import { createResource, createRoot, createSignal } from 'solid-js'
import { fetchAllSongs, fetchWorldsendSongs } from '../api/songs'

const createSongsStore = () => {
  const [songsRequested, setSongsRequested] = createSignal(false)
  const [worldsendSongsRequested, setWorldsendSongsRequested] = createSignal(false)

  const [songsResponse] = createResource(() => (songsRequested() ? true : undefined), fetchAllSongs)
  const [worldsendSongsResponse] = createResource(
    () => (worldsendSongsRequested() ? true : undefined),
    fetchWorldsendSongs
  )

  const ensureSongsLoaded = () => {
    setSongsRequested(true)
  }

  const ensureWorldsendSongsLoaded = () => {
    setWorldsendSongsRequested(true)
  }

  const isSongsLoading = () => !songsRequested() || songsResponse.loading
  const isWorldsendSongsLoading = () => !worldsendSongsRequested() || worldsendSongsResponse.loading

  return {
    songsResponse,
    worldsendSongsResponse,
    ensureSongsLoaded,
    ensureWorldsendSongsLoaded,
    isSongsLoading,
    isWorldsendSongsLoading,
  }
}

export const sortSongsByTitle = <T extends { title: string }>(songs: T[]): T[] => {
  return [...songs].sort((a, b) => a.title.localeCompare(b.title, 'ja'))
}

const songsStore = createRoot(createSongsStore)

export const useSongsData = () => songsStore
