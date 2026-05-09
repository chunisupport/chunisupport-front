import { API_BASE_URL } from '../config'
import type {
  AdminUserListResponse,
  PlayerLockedSongRequest,
  PlayerLockedSongsResponse,
  UserDTO,
  UserProfileDTO,
  UserRatingDTO,
  UserRecordDTO,
} from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

type FetchUserRecordOptions = {
  includeNoPlay?: boolean
}

type FetchMeOptions = {
  redirectOnUnauthorized?: boolean
}

export const fetchUserProfileSummary = async (username: string): Promise<UserProfileDTO> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/profile`
  )

  return response.json()
}

export const fetchUserRating = async (username: string): Promise<UserRatingDTO> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/rating`
  )

  return response.json()
}

export const fetchUserRecord = async (
  username: string,
  options: FetchUserRecordOptions = {}
): Promise<UserRecordDTO> => {
  const url = new URL(`${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/record`)
  if (options.includeNoPlay) {
    url.searchParams.set('include_noplay', 'true')
  }
  const response = await fetchWithAuth(url)

  return response.json()
}

export const fetchMe = async (options: FetchMeOptions = {}): Promise<UserDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me`, {
    redirectOnUnauthorized: options.redirectOnUnauthorized,
  })

  return response.json()
}

export const fetchUserLockedSongs = async (
  username: string
): Promise<PlayerLockedSongsResponse> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/locked-songs`
  )

  return response.json()
}

export const addMyLockedSong = async (request: PlayerLockedSongRequest): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/locked-songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

export const deleteMyLockedSong = async (request: PlayerLockedSongRequest): Promise<void> => {
  const url = new URL(
    `${API_BASE_URL}/internal/me/locked-songs/${encodeURIComponent(request.display_id)}`
  )
  url.searchParams.set('is_ultima', String(request.is_ultima ?? false))

  await fetchWithAuth(url, {
    method: 'DELETE',
  })
}

type FetchAdminUsersOptions = {
  page?: number
  name?: string
}

export const fetchAdminUsers = async (
  options: FetchAdminUsersOptions = {}
): Promise<AdminUserListResponse[]> => {
  const url = new URL(`${API_BASE_URL}/internal/users/`)
  if (typeof options.page !== 'undefined') {
    url.searchParams.set('page', String(options.page))
  }
  if (options.name) {
    url.searchParams.set('name', options.name)
  }

  const response = await fetchWithAuth(url)

  return response.json()
}

export const deleteUserByUsername = async (username: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
  })
}
