import type { Navigator } from '@solidjs/router'

import { fetchMe, fetchUserProfileSummary } from '../api/users'
import { setAuthenticatedUser } from '../stores/authSession'
import { resolvePostLoginRedirectPath } from '../usecases/auth/redirectPath'

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
  const user = await fetchMe({ redirectOnUnauthorized: false })
  setAuthenticatedUser(user)

  await fetchUserProfileSummary(user.username)

  const safeRedirectPath = resolvePostLoginRedirectPath(redirectPath)
  if (safeRedirectPath) {
    navigate(safeRedirectPath)
    return
  }

  navigate(`/users/${encodeURIComponent(user.username)}`)
}
