import { createSignal } from 'solid-js'
import type { AppAnnouncementDTO } from '../types/api'
import {
  type DismissedAppAnnouncements,
  getAppAnnouncementDismissKey,
  pruneDismissedAppAnnouncements,
  readDismissedAppAnnouncements,
  saveDismissedAppAnnouncements,
} from '../utils/appAnnouncement'

const [dismissed, setDismissed] = createSignal(readDismissedAppAnnouncements())

/**
 * 閉じた状態を更新し、localStorage へ保存する。
 *
 * @param next - 新しい閉じた状態。
 * @returns なし。
 */
const updateDismissed = (next: DismissedAppAnnouncements): void => {
  setDismissed(next)
  saveDismissedAppAnnouncements(next)
}

/**
 * お知らせを閉じたかどうかを返す。
 *
 * @param announcement - 対象のお知らせ。
 * @returns 同じバージョンを閉じていれば true。
 */
export const isAppAnnouncementDismissed = (announcement: AppAnnouncementDTO): boolean =>
  dismissed().includes(getAppAnnouncementDismissKey(announcement))

/**
 * お知らせを閉じた状態として記録する。
 *
 * @param announcement - 閉じるお知らせ。
 * @returns なし。
 */
export const dismissAppAnnouncement = (announcement: AppAnnouncementDTO): void => {
  updateDismissed([...dismissed(), getAppAnnouncementDismissKey(announcement)])
}

/**
 * 配信中一覧から消えたお知らせの記録を削除する。
 *
 * @param announcements - APIが返した配信中のお知らせ。
 * @returns なし。
 */
export const pruneDismissedAppAnnouncementsByActive = (
  announcements: AppAnnouncementDTO[]
): void => {
  const next = pruneDismissedAppAnnouncements(dismissed(), announcements)
  if (next.length !== dismissed().length) updateDismissed(next)
}
