import { API_BASE_URL } from '../config'
import type { UserDTO, UserProfileWithRecordsDTO } from '../types/api'
import { getErrorMessage } from '../types/api'

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
  const response = await fetch(url, {
    credentials: 'include',
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export const fetchMe = async (): Promise<UserDTO> => {
  const response = await fetch(`${API_BASE_URL}/internal/me`, {
    credentials: 'include',
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}
