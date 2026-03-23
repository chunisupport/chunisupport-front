import { useNavigate } from '@solidjs/router'
import { createSignal, onMount } from 'solid-js'

import { fetchMe, fetchUserProfile } from '../api/users'
import { clearAuthenticatedUser, getAuthenticatedUser, getAuthStatus } from '../stores/authSession'
import { resolveAuthSession } from '../usecases/auth/resolveAuthSession.ts'

const useRedirectIfAuthenticated = () => {
  const navigate = useNavigate()
  const [isCheckingAuth, setIsCheckingAuth] = createSignal(getAuthStatus() !== 'authenticated')

  onMount(async () => {
    const authStatus = await resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false }), {
      forceRefresh: true,
    })

    if (authStatus === 'authenticated') {
      const user = getAuthenticatedUser()
      if (!user) {
        setIsCheckingAuth(false)
        return
      }

      try {
        await fetchUserProfile(user.username, { view: 'rating' })
        navigate(`/users/${encodeURIComponent(user.username)}`)
        return
      } catch (error) {
        const apiError = error as Error & { code?: string }
        if (apiError.code === 'user_not_found') {
          navigate('/register-score-temp')
          return
        }

        console.error('Failed to redirect authenticated user:', error)
        clearAuthenticatedUser()
      }
    }

    setIsCheckingAuth(false)
  })

  return { isCheckingAuth }
}

export default useRedirectIfAuthenticated
