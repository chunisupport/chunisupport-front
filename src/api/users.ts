import { API_BASE_URL } from '../config'
import type { UserDTO, UserProfileWithRecordsDTO } from '../types/api'
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
