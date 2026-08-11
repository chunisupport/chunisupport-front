import assert from 'node:assert/strict'
import test from 'node:test'
import type { Announcement } from '../types/announcement'

/**
 * お知らせAPIテスト用の公開環境変数を設定する。
 *
 * @returns なし。
 */
const setupAnnouncementApiTestEnv = (): void => {
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_FRONTEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_DOCUMENTATION_URL = 'https://docs.chunisupport.net/'
  process.env.PUBLIC_BOOKMARKLET_URL = 'https://dist.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_ENTRYPOINT = 'main.js'
  process.env.PUBLIC_CHUNITHM_JACKET_BASE_URL = 'https://example.com/jackets'
  process.env.PUBLIC_FB_API_KEY = 'test-api-key'
  process.env.PUBLIC_FB_AUTH_DOMAIN = 'test.firebaseapp.com'
  process.env.PUBLIC_FB_PROJECT_ID = 'test-project'
  process.env.PUBLIC_FB_STORAGE_BUCKET = 'test.appspot.com'
  process.env.PUBLIC_FB_MESSAGING_SENDER_ID = '123456789'
  process.env.PUBLIC_FB_APP_ID = 'test-app-id'
  process.env.PUBLIC_CF_TURNSTILE_SITE_KEY = '1x00000000000000000000AA'
}

/**
 * テスト用のお知らせを生成する。
 *
 * @param index - IDと日付へ反映する連番。
 * @returns フィードに格納できるお知らせ。
 */
const createAnnouncement = (index: number) => ({
  id: `announcement-${index}`,
  title: `お知らせ${index}`,
  summary: `概要${index}`,
  publishedAt: `2026-08-${String(10 - index).padStart(2, '0')}`,
  category: 'update',
  url: `https://docs.chunisupport.net/announcements/announcement-${index}/`,
})

test('トップページ用にドキュメントサイトから最新3件を取得する', async () => {
  // Given: 4件を含むバージョン1のお知らせフィード。
  setupAnnouncementApiTestEnv()
  const requests: { url: string; accept: string | null }[] = []
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      accept: new Headers(init?.headers).get('Accept'),
    })
    return Response.json({
      version: 1,
      announcements: [0, 1, 2, 3].map(createAnnouncement),
    })
  }

  // When: トップページ用のお知らせを取得する。
  const { fetchAnnouncements } = await import(`./announcements.ts?cache=${Date.now()}`)
  const result: Announcement[] = await fetchAnnouncements()

  // Then: 正しい公開URLを使い、先頭3件だけを返す。
  assert.deepEqual(requests, [
    {
      url: 'https://docs.chunisupport.net/announcements.json',
      accept: 'application/json',
    },
  ])
  assert.deepEqual(
    result.map((announcement) => announcement.id),
    ['announcement-0', 'announcement-1', 'announcement-2']
  )
})
