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

const jaCollator = new Intl.Collator('ja')

export const sortSongsByTitle = <T extends { title: string }>(songs: T[]): T[] => {
  const keyed = songs.map((song) => ({ song, key: song.title }))
  keyed.sort((a, b) => jaCollator.compare(a.key, b.key))
  return keyed.map(({ song }) => song)
}

const songsStore = createRoot(createSongsStore)

export const useSongsData = () => songsStore
