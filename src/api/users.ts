import { API_BASE_URL } from '../config'
import type { AdminUserListResponse, UserDTO, UserProfileWithRecordsDTO } from '../types/api'
import { getErrorMessage } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

const throwApiError = async (response: Response): Promise<never> => {
  let message = `HTTP ${response.status}`
  try {
    const error = await response.json()
    message = getErrorMessage(error)
  } catch {
    // ignore
  }

  const apiError = new Error(message) as Error & { status?: number }
  apiError.status = response.status
  throw apiError
}

type FetchUserProfileOptions = {
  view?: 'rating'
  includeNoPlay?: boolean
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
  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export const fetchMe = async (): Promise<UserDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me`)
  if (!response.ok) {
    await throwApiError(response)
  }

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

export const restoreUserByUsername = async (username: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/restore`, {
    method: 'POST',
  })
}
