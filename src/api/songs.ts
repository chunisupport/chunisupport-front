import { API_BASE_URL } from '../config'
import type {
  EditorSongDTO,
  EditorWorldsendSongDTO,
  MasterDataDTO,
  SongDTO,
  SongStatsResponseDTO,
  UpdateSongRequestDTO,
  UpdateWorldsendSongRequestDTO,
  WorldsendSongDTO,
} from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

export const fetchAllSongs = async (): Promise<{ songs: SongDTO[] }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/songs`)

  return response.json()
}

export const fetchEditorSongs = async (): Promise<{ songs: EditorSongDTO[] }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/editor/songs`)

  return response.json()
}

export const fetchWorldsendSongs = async (): Promise<{ songs: WorldsendSongDTO[] }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/songs/worldsend`)

  return response.json()
}

export const fetchEditorWorldsendSongs = async (): Promise<{ songs: EditorWorldsendSongDTO[] }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/editor/songs/worldsend`)

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

export const updateWorldsendSongs = async (
  requests: UpdateWorldsendSongRequestDTO[]
): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/songs/worldsend`, {
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
