import { useNavigate } from '@solidjs/router'
import { createSignal, onMount } from 'solid-js'

import { fetchMe, fetchUserProfileSummary } from '../api/users.ts'
import { REGISTER_SCORE_TEMP_PATH } from '../constants/routes.ts'
import { clearAuthenticatedUser, getAuthenticatedUser, getAuthStatus } from '../stores/authSession.ts'
import { resolvePostLoginRedirectPath } from '../usecases/auth/redirectPath.ts'
import { resolveAuthenticatedRedirect } from '../usecases/auth/resolveAuthenticatedRedirect.ts'
import { resolveAuthSession } from '../usecases/auth/resolveAuthSession.ts'

const useRedirectIfAuthenticated = (redirectPath?: string) => {
  const navigate = useNavigate()
  const [isCheckingAuth, setIsCheckingAuth] = createSignal(getAuthStatus() !== 'authenticated')

  onMount(async () => {
    const authStatus = await resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false }), {
      forceRefresh: true,
    })

    if (authStatus === 'authenticated') {
      try {
        const fallbackRedirectPath = await resolveAuthenticatedRedirect(
          getAuthenticatedUser(),
          fetchUserProfileSummary
        )

        if (fallbackRedirectPath === REGISTER_SCORE_TEMP_PATH) {
          navigate(fallbackRedirectPath)
          return
        }

        const safeRedirectPath = resolvePostLoginRedirectPath(redirectPath)
        if (safeRedirectPath) {
          navigate(safeRedirectPath)
          return
        }

        if (fallbackRedirectPath) {
          navigate(fallbackRedirectPath)
          return
        }
      } catch (error) {
        console.error('Failed to redirect authenticated user:', error)
        clearAuthenticatedUser()
      }
    }

    setIsCheckingAuth(false)
  })

  return { isCheckingAuth }
}

export default useRedirectIfAuthenticated
