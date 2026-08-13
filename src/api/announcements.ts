import {
  ANNOUNCEMENTS_DISPLAY_LIMIT,
  ANNOUNCEMENTS_FEED_URL,
  ANNOUNCEMENTS_LIST_URL,
} from '../constants/announcements'
import type { Announcement } from '../types/announcement'
import { parseAnnouncementFeed } from '../utils/announcementFeed'

const ANNOUNCEMENTS_FETCH_ERROR_MESSAGE = 'お知らせの取得に失敗しました'

/**
 * ドキュメントサイトからトップページ用のお知らせを取得する。
 *
 * @returns 公開日の新しい順で最大3件のお知らせ。
 * @throws 通信またはレスポンス形式に問題がある場合。
 */
export const fetchAnnouncements = async (): Promise<Announcement[]> => {
  const response = await fetch(ANNOUNCEMENTS_FEED_URL, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(ANNOUNCEMENTS_FETCH_ERROR_MESSAGE)
  }

  return parseAnnouncementFeed(await response.json(), ANNOUNCEMENTS_LIST_URL).announcements.slice(
    0,
    ANNOUNCEMENTS_DISPLAY_LIMIT
  )
}
