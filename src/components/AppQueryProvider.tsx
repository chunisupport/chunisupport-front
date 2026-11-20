import { QueryClientProvider, useQueryClient } from '@tanstack/solid-query'
import { createEffect, type JSX } from 'solid-js'
import { appQueryClient } from '../lib/queryClient'
import { courseQueryKeys } from '../queries/courses'
import { clearFriendQueriesForUser } from '../queries/friends'
import { authSession } from '../stores/authSession'

type AppQueryProviderProps = {
  /** QueryClientを共有するアプリケーション要素。 */
  children: JSX.Element
}

/**
 * ログアウトやユーザー名の変更時に、旧ユーザーのフレンド・コース関連キャッシュを破棄する。
 *
 * @param props - QueryClient配下のアプリケーション要素。
 * @returns 認証ライフサイクル監視を付与した要素。
 */
const AuthenticatedUserQueryLifecycle = (props: AppQueryProviderProps): JSX.Element => {
  const queryClient = useQueryClient()
  let previousUsername: string | null = null

  createEffect(() => {
    const currentUsername = authSession.user?.username ?? null
    const usernameToClear = previousUsername
    previousUsername = currentUsername

    if (usernameToClear && usernameToClear !== currentUsername) {
      queryClient.removeQueries({ queryKey: courseQueryKeys.user(usernameToClear) })
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
    <AuthenticatedUserQueryLifecycle>{props.children}</AuthenticatedUserQueryLifecycle>
  </QueryClientProvider>
)
