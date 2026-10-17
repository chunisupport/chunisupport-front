import { ExternalLink, Info } from 'lucide-solid'
import type { Component } from 'solid-js'
import { Match, Switch } from 'solid-js'
import type { PlayerDataStatus } from '../../usecases/auth/resolvePlayerDataStatus'
import {
  DATA_REGISTRATION_HELP_URL,
  PLAYER_DATA_EMPTY_STATE_TEXT,
} from '../PlayerDataEmptyState/constants'
import { OWN_DATA_NOTICE_TEXT } from './constants'
import LoginActionLinks from './LoginActionLinks'

/**
 * 一部機能だけが自分のプレイヤーデータを必要とするツールで、使えない理由と解決導線を表示する。
 * 登録済み、または判定中の場合は何も表示しない。
 *
 * @param props.status - ログイン状態とプレイヤーデータ登録状態。
 * @returns 未ログイン・未登録時の案内。
 */
const OwnDataNotice: Component<{ status: PlayerDataStatus | undefined }> = (props) => (
  <Switch>
    <Match when={props.status === 'unauthenticated'}>
      <div class="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="flex items-center gap-2 text-sm text-text-muted">
          <Info class="h-4 w-4 shrink-0 text-action-primary" aria-hidden="true" />
          {OWN_DATA_NOTICE_TEXT.unauthenticated}
        </p>
        <LoginActionLinks size="sm" />
      </div>
    </Match>
    <Match when={props.status === 'unregistered'}>
      <div class="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="flex items-center gap-2 text-sm text-text-muted">
          <Info class="h-4 w-4 shrink-0 text-action-primary" aria-hidden="true" />
          {OWN_DATA_NOTICE_TEXT.unregistered}
        </p>
        <a
          href={DATA_REGISTRATION_HELP_URL}
          target="_blank"
          rel="noreferrer"
          class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-action-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          {PLAYER_DATA_EMPTY_STATE_TEXT.dataRegistrationHelpLink}
          <ExternalLink class="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </Match>
  </Switch>
)

export default OwnDataNotice
