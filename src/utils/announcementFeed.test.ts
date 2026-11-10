import assert from 'node:assert/strict'
import test from 'node:test'
import { formatAnnouncementDate, parseAnnouncementFeed } from './announcementFeed'

const ANNOUNCEMENTS_BASE_URL = 'https://docs.chunisupport.net/announcements/'

const VALID_FEED = {
  version: 1,
  announcements: [
    {
      id: '2026-08-11-announcements',
      title: 'お知らせページを公開しました',
      summary: '更新やメンテナンスなどの情報を掲載します。',
      publishedAt: '2026-08-11',
      category: 'update',
      url: 'https://docs.chunisupport.net/announcements/2026-08-11-announcements/',
    },
  ],
}

test('バージョン1のお知らせフィードを受け入れる', () => {
  // Given: 必須項目を備えたフィード。
  const feed = structuredClone(VALID_FEED)

  // When: 外部JSONを検証する。
  const result = parseAnnouncementFeed(feed, ANNOUNCEMENTS_BASE_URL)

  // Then: お知らせを型付きデータとして返す。
  assert.deepEqual(result, VALID_FEED)
})

test('未対応カテゴリを含むお知らせフィードを拒否する', () => {
  // Given: 未対応カテゴリを含むフィード。
  const feed = structuredClone(VALID_FEED)
  feed.announcements[0].category = 'release'

  // When & Then: 不正な外部JSONとして拒否する。
  assert.throws(
    () => parseAnnouncementFeed(feed, ANNOUNCEMENTS_BASE_URL),
    new Error('お知らせの形式が不正です')
  )
})

test('未対応バージョンのお知らせフィードを拒否する', () => {
  // Given: 将来の未対応バージョンを持つフィード。
  const feed = { ...structuredClone(VALID_FEED), version: 2 }

  // When & Then: 誤った解釈をせず拒否する。
  assert.throws(
    () => parseAnnouncementFeed(feed, ANNOUNCEMENTS_BASE_URL),
    new Error('お知らせの形式が不正です')
  )
})

test('存在しない公開日を含むお知らせフィードを拒否する', () => {
  // Given: 暦に存在しない日付を含むフィード。
  const feed = structuredClone(VALID_FEED)
  feed.announcements[0].publishedAt = '2026-02-30'

  // When & Then: 描画時例外になる日付を取得時に拒否する。
  assert.throws(
    () => parseAnnouncementFeed(feed, ANNOUNCEMENTS_BASE_URL),
    new Error('お知らせの形式が不正です')
  )
})

test('許可されたドキュメント配下ではないURLを拒否する', () => {
  // Given: スクリプトURLを含むフィード。
  const feed = structuredClone(VALID_FEED)
  feed.announcements[0].url = 'javascript:alert(1)'

  // When & Then: リンクへ設定される前に拒否する。
  assert.throws(
    () => parseAnnouncementFeed(feed, ANNOUNCEMENTS_BASE_URL),
    new Error('お知らせの形式が不正です')
  )
})

test('公開日を日本語表記へ整形する', () => {
  // Given: YYYY-MM-DD形式の公開日。
  const publishedAt = '2026-08-11'

  // When: 表示用日付へ整形する。
  const result = formatAnnouncementDate(publishedAt)

  // Then: 実行環境のタイムゾーンに影響されない日付になる。
  assert.equal(result, '2026年8月11日')
})
