import type { Announcement, AnnouncementCategory, AnnouncementFeed } from '../types/announcement'

const ANNOUNCEMENT_CATEGORIES = new Set<AnnouncementCategory>([
  'important',
  'update',
  'maintenance',
  'other',
])
const ANNOUNCEMENT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const INVALID_ANNOUNCEMENT_FEED_MESSAGE = 'お知らせの形式が不正です'

/**
 * 値がプロパティを検査できるオブジェクトか判定する。
 *
 * @param value - 判定対象。
 * @returns オブジェクトの場合はtrue。
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

/**
 * YYYY-MM-DDが暦として実在する日付か判定する。
 *
 * @param value - 判定対象の日付文字列。
 * @returns 実在する日付の場合はtrue。
 */
const isAnnouncementDate = (value: string): boolean => {
  if (!ANNOUNCEMENT_DATE_PATTERN.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

/**
 * リンクが設定済みドキュメントサイトのお知らせ配下か判定する。
 *
 * @param value - 判定対象のURL。
 * @param announcementBaseUrl - 許可するお知らせ一覧URL。
 * @returns 許可された配下のURLの場合はtrue。
 */
const isAnnouncementUrl = (value: string, announcementBaseUrl: string): boolean => {
  if (!URL.canParse(value) || !URL.canParse(announcementBaseUrl)) {
    return false
  }

  const url = new URL(value)
  const baseUrl = new URL(announcementBaseUrl)
  return (
    url.protocol === baseUrl.protocol &&
    url.origin === baseUrl.origin &&
    url.pathname.startsWith(baseUrl.pathname)
  )
}

/**
 * 外部JSONの1件をお知らせとして検証する。
 *
 * @param value - 検証対象。
 * @param announcementBaseUrl - 許可するお知らせ一覧URL。
 * @returns お知らせ形式の場合はtrue。
 */
const isAnnouncement = (value: unknown, announcementBaseUrl: string): value is Announcement => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.summary === 'string' &&
    typeof value.publishedAt === 'string' &&
    isAnnouncementDate(value.publishedAt) &&
    typeof value.category === 'string' &&
    ANNOUNCEMENT_CATEGORIES.has(value.category as AnnouncementCategory) &&
    typeof value.url === 'string' &&
    isAnnouncementUrl(value.url, announcementBaseUrl)
  )
}

/**
 * ドキュメントサイトのお知らせJSONをアプリ内の型へ変換する。
 *
 * @param value - JSONとして取得した値。
 * @param announcementBaseUrl - 許可するお知らせ一覧URL。
 * @returns 検証済みのお知らせフィード。
 * @throws フィードのバージョンまたは各項目の形式が不正な場合。
 */
export const parseAnnouncementFeed = (
  value: unknown,
  announcementBaseUrl: string
): AnnouncementFeed => {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.announcements) ||
    !value.announcements.every((announcement) => isAnnouncement(announcement, announcementBaseUrl))
  ) {
    throw new Error(INVALID_ANNOUNCEMENT_FEED_MESSAGE)
  }

  return value as AnnouncementFeed
}

/**
 * ISO日付を日本語の表示用日付へ整形する。
 *
 * @param publishedAt - YYYY-MM-DD形式の公開日。
 * @returns 日本時間に依存しない日本語の日付。
 */
export const formatAnnouncementDate = (publishedAt: string): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${publishedAt}T00:00:00Z`))
}
