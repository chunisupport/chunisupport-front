import { createResource } from 'solid-js'
import { fetchMe, fetchUserProfileSummary } from '../api/users'
import { authSession } from '../stores/authSession'
import { resolveAuthSession } from '../usecases/auth/resolveAuthSession'
import { resolvePlayerDataStatus } from '../usecases/auth/resolvePlayerDataStatus'

/**
 * ログイン状態とプレイヤーデータ登録状態を取得する Primitive。
 *
 * @returns 利用可否の resource と、登録済みの場合だけ本人のユーザー名を返す関数。
 */
export const createPlayerDataStatus = () => {
  const [status] = createResource(() =>
    resolvePlayerDataStatus({
      resolveAuth: () => resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false })),
      getUsername: () => authSession.user?.username ?? null,
      fetchProfile: fetchUserProfileSummary,
    })
  )

  /**
   * 自分のプレイヤーデータを取得できる場合のユーザー名を返す。
   *
   * @returns 登録済みならユーザー名。未ログイン・未登録・判定中・取得失敗は undefined。
   */
  const ownUsername = (): string | undefined =>
    status.state === 'ready' && status() === 'registered' ? authSession.user?.username : undefined

  return { status, ownUsername }
}
