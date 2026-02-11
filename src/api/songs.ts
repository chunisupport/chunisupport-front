import { API_BASE_URL } from '../config'
import {
  getErrorMessage,
  type MasterDataDTO,
  type SongDTO,
  type SongStatsResponseDTO,
  type UpdateSongRequestDTO,
  type WorldsendSongDTO,
} from '../types/api'

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

  const response = await fetch(url, {
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }

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

  const response = await fetch(url, {
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

export const updateSongs = async (requests: UpdateSongRequestDTO[]): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/songs`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(requests),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
}

export const deleteSongByDisplayId = async (displayId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
}

export const restoreSongByDisplayId = async (displayId: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}/restore`,
    {
      method: 'POST',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
}

export const deleteWorldsendSongByDisplayId = async (displayId: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/internal/songs/worldsend/${encodeURIComponent(displayId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
}

export const restoreWorldsendSongByDisplayId = async (displayId: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/internal/songs/worldsend/${encodeURIComponent(displayId)}/restore`,
    {
      method: 'POST',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
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
