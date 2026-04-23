import { createResource, createRoot } from 'solid-js'
import { fetchAllSongs, fetchWorldsendSongs } from '../api/songs'

const createSongsStore = () => {
  const [songsResponse] = createResource(fetchAllSongs)
  const [worldsendSongsResponse] = createResource(fetchWorldsendSongs)

  return { songsResponse, worldsendSongsResponse }
}

export const sortSongsByTitle = <T extends { title: string }>(songs: T[]): T[] => {
  return [...songs].sort((a, b) => a.title.localeCompare(b.title, 'ja'))
}

const songsStore = createRoot(createSongsStore)

export const useSongsData = () => songsStore
