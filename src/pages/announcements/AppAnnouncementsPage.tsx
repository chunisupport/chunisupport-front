import { createQuery } from '@tanstack/solid-query'
import ExternalLink from 'lucide-solid/icons/external-link'
import { For, Match, Switch } from 'solid-js'
import { LoadError, Loading } from '../../components'
import { AppAnnouncementBanner } from '../../components/appAnnouncements/AppAnnouncementBanner'
import {
  ANNOUNCEMENTS_EMPTY_MESSAGE,
  ANNOUNCEMENTS_LIST_URL,
  ANNOUNCEMENTS_LOADING_LABEL,
} from '../../constants/announcements'
import { APP_ANNOUNCEMENTS_COPY, APP_ANNOUNCEMENTS_TITLE } from '../../constants/appAnnouncements'
import { EXTERNAL_LINK_NEW_TAB_DESCRIPTION } from '../../constants/externalLink'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { appAnnouncementsQueryOptions } from '../../queries/appAnnouncements'
import { authSession } from '../../stores/authSession'
import { resolveAppAnnouncementAction } from '../../utils/appAnnouncement'

/**
 * 閉じたものも含め、配信中のお知らせをすべて表示する画面。
 *
 * @returns お知らせ一覧画面。
 */
const AppAnnouncementsPage = () => {
  useDocumentTitle(APP_ANNOUNCEMENTS_TITLE)

  const announcements = createQuery(() =>
    appAnnouncementsQueryOptions(authSession.user?.username ?? null)
  )
  const visibleAnnouncements = () =>
    (announcements.data ?? []).filter(
      (announcement) => resolveAppAnnouncementAction(announcement) !== null
    )

  return (
    <main class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold">{APP_ANNOUNCEMENTS_TITLE}</h1>
        <a
          href={ANNOUNCEMENTS_LIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-sm font-medium text-action-primary underline hover:text-action-primary-hover"
        >
          {APP_ANNOUNCEMENTS_COPY.docsLink}
          <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="sr-only">{EXTERNAL_LINK_NEW_TAB_DESCRIPTION}</span>
        </a>
      </div>

      <Switch>
        <Match when={announcements.error}>
          <LoadError error={announcements.error} />
        </Match>
        <Match when={announcements.isPending}>
          <Loading ariaLabel={ANNOUNCEMENTS_LOADING_LABEL} />
        </Match>
        <Match when={visibleAnnouncements().length === 0}>
          <p class="rounded-md border border-border bg-surface px-3 py-4 text-center text-sm text-text-muted">
            {ANNOUNCEMENTS_EMPTY_MESSAGE}
          </p>
        </Match>
        <Match when={visibleAnnouncements().length > 0}>
          <div class="flex flex-col gap-2">
            <For each={visibleAnnouncements()}>
              {(announcement) => <AppAnnouncementBanner announcement={announcement} />}
            </For>
          </div>
        </Match>
      </Switch>
    </main>
  )
}

export default AppAnnouncementsPage
