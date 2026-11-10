import { createResource, For, Show } from 'solid-js'
import { fetchAnnouncements } from '../../api/announcements'
import {
  ANNOUNCEMENT_CATEGORY_CLASSES,
  ANNOUNCEMENT_CATEGORY_LABELS,
  ANNOUNCEMENTS_EMPTY_MESSAGE,
  ANNOUNCEMENTS_HEADING,
  ANNOUNCEMENTS_LIST_LINK_TEXT,
  ANNOUNCEMENTS_LIST_URL,
  ANNOUNCEMENTS_LOADING_LABEL,
} from '../../constants/announcements'
import { formatAnnouncementDate } from '../../utils/announcementFeed'
import LoadError from '../LoadError/LoadError'
import Loading from '../Loading/Loading'

/**
 * ドキュメントサイトから取得した最新のお知らせを表示する。
 *
 * @returns 読み込み状態を含むトップページのお知らせ欄。
 */
const Announcements = () => {
  const [announcements] = createResource(fetchAnnouncements)

  return (
    <section class="min-w-0 rounded-lg border border-border bg-surface p-6">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h2 class="text-xl font-semibold">{ANNOUNCEMENTS_HEADING}</h2>
        <a
          href={ANNOUNCEMENTS_LIST_URL}
          class="shrink-0 text-sm font-medium text-action-primary underline hover:text-action-primary-hover"
        >
          {ANNOUNCEMENTS_LIST_LINK_TEXT}
        </a>
      </div>

      <Show
        when={!announcements.loading}
        fallback={
          <div class="h-24">
            <Loading ariaLabel={ANNOUNCEMENTS_LOADING_LABEL} />
          </div>
        }
      >
        <Show when={!announcements.error} fallback={<LoadError error={announcements.error} />}>
          <Show
            when={(announcements()?.length ?? 0) > 0}
            fallback={<p class="text-sm text-text-muted">{ANNOUNCEMENTS_EMPTY_MESSAGE}</p>}
          >
            <ul class="space-y-2">
              <For each={announcements()}>
                {(announcement) => (
                  <li>
                    <a
                      href={announcement.url}
                      class="block rounded-md border border-border p-3 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      <div class="mb-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        <span
                          class={`rounded-full border px-2 py-0.5 font-medium ${ANNOUNCEMENT_CATEGORY_CLASSES[announcement.category]}`}
                        >
                          {ANNOUNCEMENT_CATEGORY_LABELS[announcement.category]}
                        </span>
                        <time dateTime={announcement.publishedAt}>
                          {formatAnnouncementDate(announcement.publishedAt)}
                        </time>
                      </div>
                      <p class="font-sans text-sm font-semibold text-text">{announcement.title}</p>
                      <p class="mt-1 line-clamp-2 font-sans text-sm text-text-muted">
                        {announcement.summary}
                      </p>
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </Show>
      </Show>
    </section>
  )
}

export default Announcements
