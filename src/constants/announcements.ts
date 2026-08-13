import { DOCUMENTATION_BASE_URL } from '../config'
import type { AnnouncementCategory } from '../types/announcement'

const DOCUMENTATION_URL = DOCUMENTATION_BASE_URL.replace(/\/$/, '')

export const ANNOUNCEMENTS_HEADING = 'お知らせ'
export const ANNOUNCEMENTS_LIST_URL = `${DOCUMENTATION_URL}/announcements/`
export const ANNOUNCEMENTS_FEED_URL = `${DOCUMENTATION_URL}/announcements.json`
export const ANNOUNCEMENTS_LIST_LINK_TEXT = 'すべて見る'
export const ANNOUNCEMENTS_EMPTY_MESSAGE = '現在、お知らせはありません。'
export const ANNOUNCEMENTS_LOADING_LABEL = 'お知らせを読み込み中'
export const ANNOUNCEMENTS_DISPLAY_LIMIT = 3

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  important: '重要',
  update: 'アップデート',
  maintenance: 'メンテナンス',
  other: 'その他',
}

export const ANNOUNCEMENT_CATEGORY_CLASSES: Record<AnnouncementCategory, string> = {
  important: 'border-danger-border bg-danger-bg text-danger',
  update: 'border-info-border bg-info-bg text-info',
  maintenance: 'border-warning-border bg-warning-bg text-warning',
  other: 'border-border bg-surface-muted text-text-muted',
}
