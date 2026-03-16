import type { NavigateFunction } from '@solidjs/router'

import { fetchMe, fetchUserProfile } from '../api/users'
import { clearAuthenticatedUser, setAuthenticatedUser } from '../stores/authSession'

export const redirectAfterAuthentication = async (navigate: NavigateFunction): Promise<void> => {
  const user = await fetchMe({ redirectOnUnauthorized: false })
  setAuthenticatedUser(user)

  try {
    await fetchUserProfile(user.username, { view: 'rating' })
    navigate(`/users/${encodeURIComponent(user.username)}`)
  } catch (error) {
    const apiError = error as Error & { code?: string }
    if (apiError.code === 'user_not_found') {
      navigate('/register-score-temp')
      return
    }

    clearAuthenticatedUser()
    throw error
  }
}
