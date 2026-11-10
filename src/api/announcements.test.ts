import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'
import type { Announcement } from '../types/announcement'

/**
 * テスト用のお知らせを生成する。
 * @param index IDと日付へ反映する連番。
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
  const calls = installFetchRecorder(() =>
    Response.json({
      version: 1,
      announcements: [0, 1, 2, 3].map(createAnnouncement),
    })
  )
  const { fetchAnnouncements } = await loadTestModule(
    (cacheKey) => import(`./announcements.ts?cache=${cacheKey}`),
    { env: { PUBLIC_DOCUMENTATION_URL: 'https://docs.chunisupport.net/' } }
  )

  // When: トップページ用のお知らせを取得する。
  const result: Announcement[] = await fetchAnnouncements()

  // Then: 正しい公開URLを使い、先頭3件だけを返す。
  assert.equal(String(calls[0]?.input), 'https://docs.chunisupport.net/announcements.json')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Accept'), 'application/json')
  assert.deepEqual(
    result.map((announcement) => announcement.id),
    ['announcement-0', 'announcement-1', 'announcement-2']
  )
})
