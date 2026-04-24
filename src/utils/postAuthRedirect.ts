import type { Navigator } from '@solidjs/router'

import { fetchMe, fetchUserProfileSummary } from '../api/users'
import { REGISTER_SCORE_TEMP_PATH } from '../constants/routes'
import { setAuthenticatedUser } from '../stores/authSession'
import { resolvePostLoginRedirectPath } from '../usecases/auth/redirectPath'

export const redirectAfterAuthentication = async (
  navigate: Navigator,
  redirectPath?: string
): Promise<void> => {
  const user = await fetchMe({ redirectOnUnauthorized: false })
  setAuthenticatedUser(user)

  try {
    await fetchUserProfileSummary(user.username)
  } catch (error) {
    const apiError = error as Error & { code?: string }
    if (apiError.code === 'user_not_found') {
      navigate(REGISTER_SCORE_TEMP_PATH)
      return
    }

    throw error
  }

  const safeRedirectPath = resolvePostLoginRedirectPath(redirectPath)
  if (safeRedirectPath) {
    navigate(safeRedirectPath)
    return
  }

  navigate(`/users/${encodeURIComponent(user.username)}`)
}
