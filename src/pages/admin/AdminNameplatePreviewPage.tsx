import { For } from 'solid-js'
import { POSSESSION_NAMES } from '../../constants/possession'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { UserNameplate } from '../users/UserPage/components/UserNameplate'
import { ADMIN_NAMEPLATE_PREVIEW_COPY } from './AdminNameplatePreviewPage.constants'
import {
  NAMEPLATE_PREVIEW_HONORS,
  NAMEPLATE_PREVIEW_PLAYER,
  NAMEPLATE_PREVIEW_RATING,
} from './adminNameplatePreview'

/**
 * ポゼッションごとのプロフィールカード背景を並べて確認する。
 *
 * @returns ポゼッション確認画面。
 */
const AdminNameplatePreviewPage = () => {
  useDocumentTitle(ADMIN_NAMEPLATE_PREVIEW_COPY.pageTitle)

  return (
    <div class="mx-auto w-full max-w-3xl p-4">
      <h1 class="mb-6 text-2xl font-semibold">{ADMIN_NAMEPLATE_PREVIEW_COPY.heading}</h1>
      <div class="flex flex-col gap-8">
        <For each={POSSESSION_NAMES}>
          {(name) => (
            <section>
              <h2 class="mb-2 text-center font-sans text-sm text-text-muted">{name}</h2>
              <UserNameplate
                playerInfo={NAMEPLATE_PREVIEW_PLAYER}
                honors={NAMEPLATE_PREVIEW_HONORS}
                rating={NAMEPLATE_PREVIEW_RATING}
                historyHref="#"
                possessionName={name}
              />
            </section>
          )}
        </For>
      </div>
    </div>
  )
}

export default AdminNameplatePreviewPage
