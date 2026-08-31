import { QueryClientProvider, useQueryClient } from '@tanstack/solid-query'
import { createEffect, type JSX } from 'solid-js'
import { appQueryClient } from '../lib/queryClient'
import { clearFriendQueriesForUser } from '../queries/friends'
import { authSession } from '../stores/authSession'

type AppQueryProviderProps = {
  /** QueryClientを共有するアプリケーション要素。 */
  children: JSX.Element
}

/**
 * 認証主体の変更時に旧ユーザーのフレンド関連キャッシュを破棄する。
 *
 * @param props - QueryClient配下のアプリケーション要素。
 * @returns 認証ライフサイクル監視を付与した要素。
 */
const AuthenticatedFriendQueryLifecycle = (props: AppQueryProviderProps): JSX.Element => {
  const queryClient = useQueryClient()
  let previousUsername: string | null = null

  createEffect(() => {
    const currentUsername = authSession.user?.username ?? null
    const usernameToClear = previousUsername
    previousUsername = currentUsername

    if (usernameToClear && usernameToClear !== currentUsername) {
      void clearFriendQueriesForUser(queryClient, usernameToClear)
    }
  })

  return props.children
}

/**
 * アプリケーション全体へ単一のQueryClientを提供する。
 *
 * @param props - QueryClient配下へ配置するアプリケーション要素。
 * @returns QueryClientProviderで包んだアプリケーション。
 */
export const AppQueryProvider = (props: AppQueryProviderProps): JSX.Element => (
  <QueryClientProvider client={appQueryClient}>
    <AuthenticatedFriendQueryLifecycle>{props.children}</AuthenticatedFriendQueryLifecycle>
  </QueryClientProvider>
)
