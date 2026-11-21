import { useNavigate } from '@solidjs/router'
import { createSignal, onCleanup, onMount } from 'solid-js'

import { fetchMe } from '../api/users'
import { getAuthenticatedUser } from '../stores/authSession'
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
  const [isCheckingAuth, setIsCheckingAuth] = createSignal(true)

  let cancelled = false
  onCleanup(() => {
    cancelled = true
  })
  onMount(async () => {
    const authStatus = await resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false }), {
      forceRefresh: true,
      onSuperseded: () => {
        cancelled = true
      },
    })

    if (cancelled) {
      setIsCheckingAuth(false)
      return
    }
    const user = getAuthenticatedUser()
    if (authStatus === 'authenticated' && user) {
      navigate(resolveAuthenticatedRedirect(user.username, redirectPath))
      return
    }

    setIsCheckingAuth(false)
  })

  return { isCheckingAuth }
}

export default useRedirectIfAuthenticated
