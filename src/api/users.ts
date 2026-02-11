import { API_BASE_URL } from '../config'
import type { AdminUserListResponse, UserDTO, UserProfileWithRecordsDTO } from '../types/api'
import { getErrorMessage } from '../types/api'

type FetchUserProfileOptions = {
  view?: 'rating'
}

export const fetchUserProfile = async (
  username: string,
  options: FetchUserProfileOptions = {}
): Promise<UserProfileWithRecordsDTO> => {
  const url = new URL(`${API_BASE_URL}/internal/users/${encodeURIComponent(username)}`)
  if (options.view) {
    url.searchParams.set('view', options.view)
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

export const fetchMe = async (): Promise<UserDTO> => {
  const response = await fetch(`${API_BASE_URL}/internal/me`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
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

  const response = await fetch(url, {
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }

  return response.json()
}

export const deleteUserByUsername = async (username: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
}

export const restoreUserByUsername = async (username: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/restore`,
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
