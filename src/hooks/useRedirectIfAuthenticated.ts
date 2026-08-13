import { useNavigate } from '@solidjs/router'
import { createSignal, onMount } from 'solid-js'

import { fetchMe, fetchUserProfileSummary } from '../api/users'
import { clearAuthenticatedUser, getAuthenticatedUser, getAuthStatus } from '../stores/authSession'
import { resolvePostLoginRedirectPath } from '../usecases/auth/redirectPath.ts'
import { resolveAuthenticatedRedirect } from '../usecases/auth/resolveAuthenticatedRedirect.ts'
import { resolveAuthSession } from '../usecases/auth/resolveAuthSession.ts'

/**
 * 認証済みユーザーをログイン・登録画面から適切な画面へ移動させる。
 *
 * @param redirectPath - 認証後に復帰する候補パス。
 * @returns 認証状態を確認中かどうかを表すSignal。
 */
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
