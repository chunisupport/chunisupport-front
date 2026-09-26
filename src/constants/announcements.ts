import { DOCUMENTATION_BASE_URL } from '../config'
import { localizedCopy } from '../i18n'
import type { AnnouncementCategory } from '../types/announcement'

const DOCUMENTATION_URL = DOCUMENTATION_BASE_URL.replace(/\/$/, '')

/** お知らせ欄の表示文言 */
export const ANNOUNCEMENTS_COPY = localizedCopy('announcements')
export const ANNOUNCEMENTS_LIST_URL = `${DOCUMENTATION_URL}/announcements/`
export const ANNOUNCEMENTS_FEED_URL = `${DOCUMENTATION_URL}/announcements.json`
export const ANNOUNCEMENTS_DISPLAY_LIMIT = 3

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = localizedCopy(
  'announcements.categories'
)

export const ANNOUNCEMENT_CATEGORY_CLASSES: Record<AnnouncementCategory, string> = {
  important: 'border-danger-border bg-danger-bg text-danger',
  update: 'border-info-border bg-info-bg text-info',
  maintenance: 'border-warning-border bg-warning-bg text-warning',
  other: 'border-border bg-surface-muted text-text-muted',
}
