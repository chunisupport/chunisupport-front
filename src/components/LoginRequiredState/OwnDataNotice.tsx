import { ExternalLink, Info } from 'lucide-solid'
import type { Component } from 'solid-js'
import { Match, Show, Switch } from 'solid-js'
import type { PlayerDataStatus } from '../../usecases/auth/resolvePlayerDataStatus'
import LoadError from '../LoadError/LoadError'
import {
  DATA_REGISTRATION_HELP_URL,
  PLAYER_DATA_EMPTY_STATE_TEXT,
} from '../PlayerDataEmptyState/constants'
import { OWN_DATA_NOTICE_TEXT } from './constants'
import LoginActionLinks from './LoginActionLinks'

/** 自分のデータを使う機能だけが使えない場合の案内の props */
type OwnDataNoticeProps = {
  /** ログイン状態とプレイヤーデータ登録状態。判定失敗時は `error`、判定中は undefined */
  status: PlayerDataStatus | 'error' | undefined
}

/**
 * 一部機能だけが自分のプレイヤーデータを必要とするツールで、使えない理由と解決導線を表示する。
 * 登録済み、または判定中の場合は何も表示しない。
 *
 * @param props.status - ログイン状態とプレイヤーデータ登録状態。
 * @returns 未ログイン・未登録時の案内、または判定失敗時のエラー。
 */
const OwnDataNotice: Component<OwnDataNoticeProps> = (props) => {
  /** @returns 案内を表示する場合のメッセージ。 */
  const message = (): string | undefined =>
    props.status === 'unauthenticated' || props.status === 'unregistered'
      ? OWN_DATA_NOTICE_TEXT[props.status]
      : undefined

  return (
    <Switch>
      <Match when={props.status === 'error'}>
        <LoadError error={null} />
      </Match>
      <Match when={message()}>
        {(text) => (
          <div class="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="flex items-center gap-2 text-sm text-text-muted">
              <Info class="h-4 w-4 shrink-0 text-action-primary" aria-hidden="true" />
              {text()}
            </p>
            <Show
              when={props.status === 'unauthenticated'}
              fallback={
                <a
                  href={DATA_REGISTRATION_HELP_URL}
                  target="_blank"
                  rel="noreferrer"
                  class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-action-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {PLAYER_DATA_EMPTY_STATE_TEXT.dataRegistrationHelpLink}
                  <ExternalLink class="h-4 w-4" aria-hidden="true" />
                </a>
              }
            >
              <LoginActionLinks size="sm" />
            </Show>
          </div>
        )}
      </Match>
    </Switch>
  )
}

export default OwnDataNotice
