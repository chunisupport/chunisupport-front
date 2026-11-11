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

/**
 * お知らせカードの枠。読込中のスケルトンと揃える。
 */
export const ANNOUNCEMENT_CARD_FRAME_CLASS = 'rounded-md border border-border p-3'

/**
 * 見出し2行と要約2行が収まるお知らせカードの最小高さ。
 * 読込中もこの高さを確保し、モバイルで下のX欄が押し下げられないようにする。
 */
export const ANNOUNCEMENT_CARD_MIN_HEIGHT_CLASS = 'min-h-[8.75rem]'

/**
 * 表示上限件数分のカードと間隔を含む一覧の最小高さ。
 * 8.75rem のカード3件と、その間の 0.5rem 間隔2つで 27.25rem。
 * 0〜2件や取得失敗でも読込中のスケルトンから縮めず、下のX欄を動かさない。
 */
export const ANNOUNCEMENT_LIST_MIN_HEIGHT_CLASS = 'min-h-[27.25rem]'

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
