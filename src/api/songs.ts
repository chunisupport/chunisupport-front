import { API_BASE_URL } from '../config'
import type {
  MasterDataDTO,
  SongDTO,
  SongStatsResponseDTO,
  UpdateSongRequestDTO,
  WorldsendSongDTO,
} from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

type FetchAllSongsOptions = {
  includeDeleted?: boolean
}

export const fetchAllSongs = async (
  options: FetchAllSongsOptions = {}
): Promise<{ songs: SongDTO[] }> => {
  const url = new URL(`${API_BASE_URL}/internal/songs`)
  if (options.includeDeleted) {
    url.searchParams.set('include_deleted', 'true')
  }

  const response = await fetchWithAuth(url)

  return response.json()
}

type FetchWorldsendSongsOptions = {
  includeDeleted?: boolean
}

export const fetchWorldsendSongs = async (
  options: FetchWorldsendSongsOptions = {}
): Promise<{ songs: WorldsendSongDTO[] }> => {
  const url = new URL(`${API_BASE_URL}/internal/songs/worldsend`)
  if (options.includeDeleted) {
    url.searchParams.set('include_deleted', 'true')
  }

  const response = await fetchWithAuth(url)

  return response.json()
}

export const fetchSongByDisplayId = async (displayId: string): Promise<SongDTO> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}`
  )

  return response.json()
}

export const fetchSongStats = async (
  displayId: string,
  difficulty: string
): Promise<SongStatsResponseDTO> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}/stats/${encodeURIComponent(difficulty)}`
  )

  return response.json()
}

export const updateSongs = async (requests: UpdateSongRequestDTO[]): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/songs`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requests),
  })
}

export const deleteSongByDisplayId = async (displayId: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}`, {
    method: 'DELETE',
  })
}

export const restoreSongByDisplayId = async (displayId: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}/restore`, {
    method: 'POST',
  })
}

export const deleteWorldsendSongByDisplayId = async (displayId: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/songs/worldsend/${encodeURIComponent(displayId)}`, {
    method: 'DELETE',
  })
}

export const restoreWorldsendSongByDisplayId = async (displayId: string): Promise<void> => {
  await fetchWithAuth(
    `${API_BASE_URL}/internal/songs/worldsend/${encodeURIComponent(displayId)}/restore`,
    {
      method: 'POST',
    }
  )
}

// --- マスターデータ取得API ---
export const fetchMasterData = async (): Promise<MasterDataDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/master`)
  return response.json()
}
