import { useNavigate } from '@solidjs/router'
import { createSignal, onMount } from 'solid-js'

import { fetchMe } from '../api/users'
import { resolveAuthSession } from '../usecases/auth/resolveAuthSession.ts'
import { redirectAfterAuthentication } from '../utils/postAuthRedirect'

const useRedirectIfAuthenticated = () => {
  const navigate = useNavigate()
  const [isCheckingAuth, setIsCheckingAuth] = createSignal(true)

  onMount(async () => {
    const authStatus = await resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false }))

    if (authStatus === 'authenticated') {
      try {
        await redirectAfterAuthentication(navigate)
        return
      } catch (error) {
        console.error('Failed to redirect authenticated user:', error)
      }
    }

    setIsCheckingAuth(false)
  })

  return { isCheckingAuth }
}

export default useRedirectIfAuthenticated
