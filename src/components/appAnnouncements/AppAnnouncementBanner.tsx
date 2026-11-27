import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { A } from '@solidjs/router'
import ArrowRight from 'lucide-solid/icons/arrow-right'
import ExternalLink from 'lucide-solid/icons/external-link'
import Megaphone from 'lucide-solid/icons/megaphone'
import X from 'lucide-solid/icons/x'
import { createSignal, For, type JSX, Match, Show, Switch } from 'solid-js'
import { APP_ANNOUNCEMENTS_COPY } from '../../constants/appAnnouncements'
import { EXTERNAL_LINK_NEW_TAB_DESCRIPTION } from '../../constants/externalLink'
import type { AppAnnouncementDTO } from '../../types/api'
import {
  type AppAnnouncementAction,
  type AppAnnouncementTarget,
  parseAppAnnouncementBody,
  resolveAppAnnouncementAction,
} from '../../utils/appAnnouncement'
import { AppIconButton } from '../common/AppButton'
import { AppDialog } from '../common/AppDialog'

/** バナー本体（選択できる領域）のクラス。ホバー色はカード側で塗る */
const BANNER_ACTION_CLASS =
  'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-left font-sans text-sm font-semibold text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/**
 * カードのクラス。先頭の子（バナー本体）にホバーしたときは、閉じるボタンの部分も含めてカード全体を塗る。
 * 閉じるボタンへのホバーはボタン自身だけを塗る。
 */
const BANNER_CARD_CLASS =
  'flex items-center rounded-lg border border-action-primary-border bg-action-primary-muted has-[>:first-child:hover]:bg-row-highlight'

/** 本文中のリンクのクラス */
const BODY_LINK_CLASS = 'text-action-primary underline hover:text-action-primary-hover'

type AppAnnouncementLinkProps = {
  target: AppAnnouncementTarget
  class: string
  children: JSX.Element
}

/**
 * アプリ内パスは同一タブ、外部URLは新しいタブで開くリンクを表示する。
 *
 * @param props - 遷移先、クラス、リンク内容。
 * @returns 遷移先に応じたリンク。
 */
const AppAnnouncementLink = (props: AppAnnouncementLinkProps): JSX.Element => (
  <Show
    when={props.target.type === 'external'}
    fallback={
      <A href={props.target.href} class={props.class}>
        {props.children}
      </A>
    }
  >
    <a href={props.target.href} target="_blank" rel="noopener noreferrer" class={props.class}>
      {props.children}
      <span class="sr-only">{EXTERNAL_LINK_NEW_TAB_DESCRIPTION}</span>
    </a>
  </Show>
)

/**
 * 改行を保持し、`[リンクテキスト](URL)` だけをリンクにした本文を表示する。
 *
 * @param props - お知らせの本文。
 * @returns 本文の段落。
 */
const AppAnnouncementBody = (props: { body: string }): JSX.Element => (
  <p class="whitespace-pre-wrap break-words font-sans text-sm text-text">
    <For each={parseAppAnnouncementBody(props.body)}>
      {(segment) =>
        segment.type === 'link' ? (
          <AppAnnouncementLink target={segment.target} class={BODY_LINK_CLASS}>
            {segment.text}
          </AppAnnouncementLink>
        ) : (
          segment.text
        )
      }
    </For>
  </p>
)

/** お知らせの種別アイコンのクラス */
const KIND_ICON_CLASS = 'h-4 w-4 shrink-0 text-action-primary'

/**
 * お知らせの動作に応じたアイコンを表示する。
 * 本文型はお知らせ、アプリ内リンクは矢印、外部リンクは外部リンクのアイコンにする。
 *
 * @param props - 対象の動作。
 * @returns 種別アイコン。
 */
export const AppAnnouncementKindIcon = (props: { action: AppAnnouncementAction }): JSX.Element => (
  <Switch>
    <Match when={props.action.type === 'message'}>
      <Megaphone class={KIND_ICON_CLASS} aria-hidden="true" />
    </Match>
    <Match when={props.action.type === 'internal'}>
      <ArrowRight class={KIND_ICON_CLASS} aria-hidden="true" />
    </Match>
    <Match when={props.action.type === 'external'}>
      <ExternalLink class={KIND_ICON_CLASS} aria-hidden="true" />
    </Match>
  </Switch>
)

type AppAnnouncementBannerProps = {
  announcement: AppAnnouncementDTO
  /** 指定すると閉じるボタンを表示する */
  onDismiss?: () => void
}

/**
 * お知らせを1件のバナーとして表示する。
 * 本文型は選択でダイアログを開き、リンク型はバナー自体がリンクになる。
 * 未知の種別や遷移させられないURLのお知らせは表示しない。
 *
 * @param props - お知らせと、閉じたときの処理。
 * @returns お知らせのバナー。
 */
export const AppAnnouncementBanner = (props: AppAnnouncementBannerProps): JSX.Element => {
  const [dialogOpen, setDialogOpen] = createSignal(false)
  const action = () => resolveAppAnnouncementAction(props.announcement)
  /** @returns 本文型の場合はその本文。 */
  const messageBody = () => {
    const current = action()
    return current?.type === 'message' ? current.body : undefined
  }
  /** @returns リンク型の場合はその遷移先。 */
  const linkTarget = () => {
    const current = action()
    return current && current.type !== 'message' ? current : undefined
  }

  return (
    <Show when={action()}>
      <div class={BANNER_CARD_CLASS}>
        <Show when={messageBody()}>
          {(body) => (
            <AppDialog
              open={dialogOpen()}
              onOpenChange={setDialogOpen}
              title={<span class="break-words font-sans">{props.announcement.title}</span>}
              closeLabel={APP_ANNOUNCEMENTS_COPY.closeDialog}
              size="md"
              height="max90"
              scroll="cap"
              trigger={
                <Dialog.Trigger as={Button} class={BANNER_ACTION_CLASS}>
                  <AppAnnouncementKindIcon action={{ type: 'message', body: body() }} />
                  <span class="min-w-0 break-words">{props.announcement.title}</span>
                </Dialog.Trigger>
              }
            >
              <div class="mt-4">
                <AppAnnouncementBody body={body()} />
              </div>
            </AppDialog>
          )}
        </Show>
        <Show when={linkTarget()}>
          {(target) => (
            <AppAnnouncementLink target={target()} class={BANNER_ACTION_CLASS}>
              <AppAnnouncementKindIcon action={target()} />
              <span class="min-w-0 break-words">{props.announcement.title}</span>
            </AppAnnouncementLink>
          )}
        </Show>
        <Show when={props.onDismiss}>
          {(onDismiss) => (
            <AppIconButton
              tone="ghost"
              size="xs"
              class="mr-1.5 shrink-0 rounded-full"
              aria-label={APP_ANNOUNCEMENTS_COPY.dismiss}
              title={APP_ANNOUNCEMENTS_COPY.dismiss}
              onClick={() => onDismiss()()}
            >
              <X class="h-4 w-4" aria-hidden="true" />
            </AppIconButton>
          )}
        </Show>
      </div>
    </Show>
  )
}
