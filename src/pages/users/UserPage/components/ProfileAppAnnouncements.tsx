import { createQuery } from '@tanstack/solid-query'
import { createEffect, For, type JSX, Show } from 'solid-js'
import { AppAnnouncementBanner } from '../../../../components/appAnnouncements/AppAnnouncementBanner'
import { USER_NAMEPLATE_WIDTH_CLASS } from '../../../../components/common/profile/UserNameplate.constants'
import { appAnnouncementsQueryOptions } from '../../../../queries/appAnnouncements'
import { authSession } from '../../../../stores/authSession'
import {
  dismissAppAnnouncement,
  isAppAnnouncementDismissed,
  pruneDismissedAppAnnouncementsByActive,
} from '../../../../stores/dismissedAppAnnouncements'
import { resolveAppAnnouncementAction } from '../../../../utils/appAnnouncement'

/**
 * ログイン中の自分のプロフィールを表示しているときだけ、閉じていないお知らせを縦に並べる。
 * 取得に失敗した場合は何も表示せず、プロフィールの表示を妨げない。
 * 取得できた場合は、配信中一覧から消えたお知らせの閉じた記録を削除する。
 *
 * @param props - 表示中のプロフィールのユーザー名。
 * @returns プロフィールカード上部のお知らせ一覧。
 */
export const ProfileAppAnnouncements = (props: { username: string }): JSX.Element => {
  const isOwnProfile = () =>
    authSession.status === 'authenticated' && authSession.user?.username === props.username
  const announcements = createQuery(() =>
    appAnnouncementsQueryOptions(isOwnProfile() ? props.username : null)
  )
  createEffect(() => {
    if (announcements.data) pruneDismissedAppAnnouncementsByActive(announcements.data)
  })
  const visibleAnnouncements = () =>
    (announcements.data ?? []).filter(
      (announcement) =>
        resolveAppAnnouncementAction(announcement) !== null &&
        !isAppAnnouncementDismissed(announcement)
    )

  return (
    <Show when={isOwnProfile() && visibleAnnouncements().length > 0}>
      <div class={`${USER_NAMEPLATE_WIDTH_CLASS} mb-3 flex flex-col gap-2`}>
        <For each={visibleAnnouncements()}>
          {(announcement) => (
            <AppAnnouncementBanner
              announcement={announcement}
              onDismiss={() => dismissAppAnnouncement(announcement)}
            />
          )}
        </For>
      </div>
    </Show>
  )
}
