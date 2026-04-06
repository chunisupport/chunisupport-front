import { API_BASE_URL } from '../config'
import type { AdminUserListResponse, UserDTO, UserProfileWithRecordsDTO } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

type FetchUserProfileOptions = {
  view?: 'rating' | 'record'
  includeNoPlay?: boolean
}

type FetchMeOptions = {
  redirectOnUnauthorized?: boolean
}

export const fetchUserProfile = async (
  username: string,
  options: FetchUserProfileOptions = {}
): Promise<UserProfileWithRecordsDTO> => {
  const url = new URL(`${API_BASE_URL}/internal/users/${encodeURIComponent(username)}`)
  if (options.view) {
    url.searchParams.set('view', options.view)
  }
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
