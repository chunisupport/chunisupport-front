import { API_BASE_URL } from '../config'
import {
  getErrorMessage,
  type MasterDataDTO,
  type SongDTO,
  type SongStatsResponseDTO,
} from '../types/api'

export const fetchAllSongs = async (): Promise<{ songs: SongDTO[] }> => {
  const response = await fetch(`${API_BASE_URL}/internal/songs`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }

  return response.json()
}

export const fetchSongByDisplayId = async (displayId: string): Promise<SongDTO> => {
  const response = await fetch(`${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }

  return response.json()
}

export const fetchSongStats = async (
  displayId: string,
  difficulty: string
): Promise<SongStatsResponseDTO> => {
  const response = await fetch(
    `${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}/stats/${encodeURIComponent(difficulty)}`,
    {
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }

  return response.json()
}

// --- マスターデータ取得API ---
export const fetchMasterData = async (): Promise<MasterDataDTO> => {
  const response = await fetch(`${API_BASE_URL}/internal/master`, {
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
  return response.json()
}
