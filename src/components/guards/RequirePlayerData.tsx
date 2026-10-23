import type { JSX } from 'solid-js'
import { Match, Switch } from 'solid-js'
import { createPlayerDataStatus } from '../../hooks/createPlayerDataStatus'
import LoadError from '../LoadError/LoadError'
import Loading from '../Loading/Loading'
import { LoginRequiredState } from '../LoginRequiredState'
import { PlayerDataEmptyState } from '../PlayerDataEmptyState'

/** プレイヤーデータ guard の props */
type RequirePlayerDataProps = {
  /** プレイヤーデータ登録済みの場合に表示する画面 */
  children: JSX.Element
}

/**
 * 自分のプレイヤーデータが必要な画面を、登録済みユーザーにだけ表示する。
 * 未ログイン時はログイン・新規登録、未登録時はプレイヤーデータ登録を案内する。
 *
 * @param props.children - プレイヤーデータ登録済みの場合に表示する画面。
 * @returns 状態に応じた案内、または子要素。
 */
const RequirePlayerData = (props: RequirePlayerDataProps) => {
  const { status } = createPlayerDataStatus()

  return (
    <Switch fallback={<Loading />}>
      <Match when={status.error}>
        <div class="mx-auto w-full max-w-3xl p-4">
          <LoadError error={status.error} />
        </div>
      </Match>
      <Match when={status.state === 'ready' && status() === 'unauthenticated'}>
        <LoginRequiredState />
      </Match>
      <Match when={status.state === 'ready' && status() === 'unregistered'}>
        <PlayerDataEmptyState />
      </Match>
      <Match when={status.state === 'ready' && status() === 'registered'}>{props.children}</Match>
    </Switch>
  )
}

export default RequirePlayerData
