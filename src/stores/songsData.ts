import { createResource, createRoot } from 'solid-js'
import { fetchAllSongs, fetchWorldsendSongs } from '../api/songs'

const createSongsStore = () => {
  const [songsResponse] = createResource(fetchAllSongs)
  const [worldsendSongsResponse] = createResource(fetchWorldsendSongs)

  return { songsResponse, worldsendSongsResponse }
}

const songsStore = createRoot(createSongsStore)

export const useSongsData = () => songsStore
