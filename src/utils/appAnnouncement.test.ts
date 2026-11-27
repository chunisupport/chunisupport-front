import assert from 'node:assert/strict'
import test from 'node:test'
import type { AppAnnouncementDTO } from '../types/api'
import {
  DISMISSED_APP_ANNOUNCEMENTS_STORAGE_KEY,
  getAppAnnouncementDismissKey,
  parseAppAnnouncementBody,
  pruneDismissedAppAnnouncements,
  readDismissedAppAnnouncements,
  resolveAppAnnouncementAction,
} from './appAnnouncement'

/**
 * テスト用のお知らせを作る。
 *
 * @param overrides - 上書きする項目。
 * @returns お知らせ。
 */
const announcement = (overrides: Partial<AppAnnouncementDTO>): AppAnnouncementDTO => ({
  id: '3f2a9c1d5b7e8a04',
  kind: 'message',
  title: 'お知らせ',
  body: '本文',
  target_url: null,
  starts_at: '2026-11-01T00:00:00+09:00',
  expires_at: '2026-12-01T00:00:00+09:00',
  revision: 1,
  ...overrides,
})

/**
 * window.localStorage を差し替えた状態でテスト本体を実行する。
 *
 * @param localStorage - 差し替える localStorage の代替実装。
 * @param run - 差し替え中に実行するテスト本体。
 * @returns なし。
 */
const withLocalStorage = (localStorage: Partial<Storage>, run: () => void): void => {
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage } })
  try {
    run()
  } finally {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: previousWindow })
  }
}

test('本文型は本文を表示する動作になること', () => {
  // Given: 本文型のお知らせ
  const target = announcement({ kind: 'message', body: '本文' })

  // When & Then
  assert.deepEqual(resolveAppAnnouncementAction(target), { type: 'message', body: '本文' })
})

test('リンク型はアプリ内パスと外部URLを振り分けること', () => {
  // Given: アプリ内パスと外部URLのリンク型
  const internal = announcement({ kind: 'link', body: null, target_url: '/tools/dashboard' })
  const external = announcement({
    kind: 'link',
    body: null,
    target_url: 'https://docs.chunisupport.net/announcements/',
  })

  // When & Then
  assert.deepEqual(resolveAppAnnouncementAction(internal), {
    type: 'internal',
    href: '/tools/dashboard',
  })
  assert.deepEqual(resolveAppAnnouncementAction(external), {
    type: 'external',
    href: 'https://docs.chunisupport.net/announcements/',
  })
})

test('未知の種別や遷移させられないURLは表示しないこと', () => {
  // Given: 未知の種別、javascript: URL、プロトコル相対URL
  const cases = [
    announcement({ kind: 'image' }),
    announcement({ kind: 'link', body: null, target_url: 'javascript:alert(1)' }),
    announcement({ kind: 'link', body: null, target_url: '//evil.example.com' }),
    announcement({ kind: 'link', body: null, target_url: '/\\evil.example.com' }),
    announcement({ kind: 'link', body: null, target_url: '/\t/evil.example.com' }),
    announcement({ kind: 'link', body: null, target_url: null }),
  ]

  // When & Then
  for (const target of cases) assert.equal(resolveAppAnnouncementAction(target), null)
})

test('本文のリンク記法だけをリンクにし、不正なURLはテキストのまま残すこと', () => {
  // Given: 外部リンク、アプリ内リンク、不正なURLを含む本文
  const body = '詳しくは[記事](https://example.com)と[ツール](/tools)を参照。\n[危険](javascript:x)'

  // When
  const segments = parseAppAnnouncementBody(body)

  // Then
  assert.deepEqual(segments, [
    { type: 'text', text: '詳しくは' },
    { type: 'link', text: '記事', target: { type: 'external', href: 'https://example.com' } },
    { type: 'text', text: 'と' },
    { type: 'link', text: 'ツール', target: { type: 'internal', href: '/tools' } },
    { type: 'text', text: 'を参照。\n[危険](javascript:x)' },
  ])
})

test('閉じた状態のキーは revision ごとに分かれること', () => {
  // Given & When & Then
  assert.notEqual(
    getAppAnnouncementDismissKey(announcement({ revision: 1 })),
    getAppAnnouncementDismissKey(announcement({ revision: 2 }))
  )
})

test('配信中一覧から消えた閉じた状態だけを削除し、終了日時の延長では残すこと', () => {
  // Given: 終了日時を延長したお知らせ、revision を更新したお知らせ、配信が終わったお知らせの記録
  const dismissed = ['a:1', 'b:1', 'c:1']
  const active = [
    announcement({ id: 'a', revision: 1, expires_at: '2026-12-15T00:00:00+09:00' }),
    announcement({ id: 'b', revision: 2 }),
  ]

  // When
  const pruned = pruneDismissedAppAnnouncements(dismissed, active)

  // Then
  assert.deepEqual(pruned, ['a:1'])
})

test('閉じた状態が破損・読み取り不能でも空として扱うこと', () => {
  // Given: 壊れたJSON、配列でない値、例外を投げる localStorage
  const broken = { getItem: () => '{' }
  const notArray = { getItem: () => '{"a:1":"2026-12-01T00:00:00Z"}' }
  const throwing = {
    getItem: (key: string): string | null => {
      throw new Error(key === DISMISSED_APP_ANNOUNCEMENTS_STORAGE_KEY ? 'denied' : 'unexpected')
    },
  }

  // When & Then
  withLocalStorage(broken, () => assert.deepEqual(readDismissedAppAnnouncements(), []))
  withLocalStorage(notArray, () => assert.deepEqual(readDismissedAppAnnouncements(), []))
  withLocalStorage(throwing, () => assert.deepEqual(readDismissedAppAnnouncements(), []))
})
