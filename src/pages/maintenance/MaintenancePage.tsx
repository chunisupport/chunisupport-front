import { Wrench } from 'lucide-solid'
import { createMemo, onMount, Show } from 'solid-js'
import { X_TIMELINE_HEADING, XTimeline } from '../../components/XTimeline'
import { MAINTENANCE_PAGE_COPY } from '../../constants/maintenance'
import { MAINTENANCE_PAGE_TITLE } from '../../constants/pageTitles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { availability } from '../../stores/availability'
import { formatMaintenanceDateTime } from '../../utils/maintenanceDateTime'

/**
 * 一般利用者へメンテナンス状態と運営コメントを表示する。
 *
 * @returns メンテナンス専用画面。
 */
const MaintenancePage = () => {
  let mainElement: HTMLElement | undefined
  useDocumentTitle(MAINTENANCE_PAGE_TITLE)

  onMount(() => {
    mainElement?.focus()
  })

  const maintenance = createMemo(() => {
    const state = availability.state
    return state.kind === 'maintenance' ? state : null
  })
  const displayedComment = createMemo(
    () => maintenance()?.comment || MAINTENANCE_PAGE_COPY.defaultComment
  )
  const displayedUpdatedAt = createMemo(() =>
    formatMaintenanceDateTime(maintenance()?.updatedAt ?? null)
  )

  return (
    <main
      ref={mainElement}
      tabIndex={-1}
      class="min-h-dvh w-full bg-bg px-4 py-10 text-text focus:outline-none"
    >
      <div class="mx-auto w-full max-w-2xl space-y-6">
        <section class="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div class="flex flex-col items-center text-center">
            <span class="flex h-14 w-14 items-center justify-center rounded-full bg-warning-bg text-warning">
              <Wrench class="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 class="mt-4 text-2xl font-semibold">{MAINTENANCE_PAGE_COPY.heading}</h1>
          </div>

          <p class="mt-6 whitespace-pre-wrap break-words rounded-lg border border-border bg-surface-muted p-4 text-left font-sans leading-relaxed">
            {displayedComment()}
          </p>

          <Show when={displayedUpdatedAt()}>
            {(updatedAt) => (
              <p class="mt-3 text-center text-sm text-text-muted">
                {MAINTENANCE_PAGE_COPY.updatedAtLabel}:{' '}
                <time dateTime={maintenance()?.updatedAt ?? undefined}>
                  {updatedAt()} {MAINTENANCE_PAGE_COPY.timeZoneLabel}
                </time>
              </p>
            )}
          </Show>
        </section>

        <section class="min-w-0 rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2 class="mb-3 text-xl font-semibold">{X_TIMELINE_HEADING}</h2>
          <XTimeline />
        </section>
      </div>
    </main>
  )
}

export default MaintenancePage
