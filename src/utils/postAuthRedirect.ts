import type { Navigator } from '@solidjs/router'

import { fetchMe } from '../api/users'
import { getAuthenticatedUser } from '../stores/authSession'
import { resolveAuthenticatedRedirect } from '../usecases/auth/resolveAuthenticatedRedirect'
import { resolveAuthSession } from '../usecases/auth/resolveAuthSession'

/**
 * 認証済みユーザーを安全な復帰先またはユーザーページへ遷移させる。
 *
 * @param navigate - Solid Routerのナビゲーション関数。
 * @param redirectPath - 認証後に復帰する候補パス。
 * @returns 遷移処理の完了後に解決されるPromise。
 */
export const redirectAfterAuthentication = async (
  navigate: Navigator,
  redirectPath?: string
): Promise<void> => {
  let superseded = false
  let failure: unknown
  const status = await resolveAuthSession(
    async () => {
      try {
        return await fetchMe({ redirectOnUnauthorized: false })
      } catch (error) {
        failure = error
        throw error
      }
    },
    {
      forceRefresh: true,
      onSuperseded: () => {
        superseded = true
      },
    }
  )
  if (superseded) return
  const user = getAuthenticatedUser()
  if (status === 'authenticated' && user)
    navigate(resolveAuthenticatedRedirect(user.username, redirectPath))
  else if (failure) throw failure
}
