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

export const sortSongsByOfficialIndex = <T extends { official_idx?: string; title: string }>(
  songs: T[]
): T[] => {
  const keyed = songs.map((song) => {
    const parsed = Number(song.official_idx)
    return {
      song,
      index: Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER,
    }
  })

  keyed.sort((left, right) => {
    if (left.index !== right.index) {
      return left.index - right.index
    }

    return jaCollator.compare(left.song.title, right.song.title)
  })

  return keyed.map(({ song }) => song)
}

export const sortSongsByTitle = <T extends { title: string }>(songs: T[]): T[] => {
  const keyed = songs.map((song) => ({ song, key: song.title }))
  keyed.sort((a, b) => jaCollator.compare(a.key, b.key))
  return keyed.map(({ song }) => song)
}

const songsStore = createRoot(createSongsStore)

export const useSongsData = () => songsStore
