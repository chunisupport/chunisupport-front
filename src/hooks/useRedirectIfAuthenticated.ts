import { useNavigate } from '@solidjs/router'
import { createSignal, onMount } from 'solid-js'

import { fetchMe, fetchUserProfileSummary } from '../api/users'
import { clearAuthenticatedUser, getAuthenticatedUser, getAuthStatus } from '../stores/authSession'
import { resolveAuthenticatedRedirect } from '../usecases/auth/resolveAuthenticatedRedirect.ts'
import { resolveAuthSession } from '../usecases/auth/resolveAuthSession.ts'

const useRedirectIfAuthenticated = () => {
  const navigate = useNavigate()
  const [isCheckingAuth, setIsCheckingAuth] = createSignal(getAuthStatus() !== 'authenticated')

  onMount(async () => {
    const authStatus = await resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false }), {
      forceRefresh: true,
    })

    if (authStatus === 'authenticated') {
      try {
        const redirectPath = await resolveAuthenticatedRedirect(
          getAuthenticatedUser(),
          fetchUserProfileSummary
        )

        if (redirectPath) {
          navigate(redirectPath)
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
