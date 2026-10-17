import { createResource } from 'solid-js'
import { fetchMe, fetchUserProfileSummary } from '../api/users'
import { authSession } from '../stores/authSession'
import { resolveAuthSession } from '../usecases/auth/resolveAuthSession'
import {
  type PlayerDataStatus,
  resolvePlayerDataStatus,
} from '../usecases/auth/resolvePlayerDataStatus'

/**
 * ログイン状態とプレイヤーデータ登録状態を取得する Primitive。
 *
 * @returns 利用可否の resource、案内表示用の状態、登録済みの場合だけ本人のユーザー名を返す関数。
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

  /**
   * 案内表示用に、判定失敗を `error` として含めた状態を返す。
   *
   * @returns 判定結果。判定失敗時は `error`、判定中は undefined。
   */
  const noticeStatus = (): PlayerDataStatus | 'error' | undefined =>
    status.error ? 'error' : status()

  return { status, noticeStatus, ownUsername }
}
