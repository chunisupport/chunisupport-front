import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import { db } from '../lib/db/cacheDB.ts'

afterEach(async () => {
  await db.friendRequestNotificationStates.clear()
})

/**
 * store モジュールの読み込みに必要なフロントエンド環境変数を設定する。
 *
 * @returns なし。
 */
const setupStoreTestEnv = (): void => {
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_FRONTEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_DOCUMENTATION_URL = 'https://docs.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_URL = 'https://dist.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_ENTRYPOINT = 'main.js'
  process.env.PUBLIC_FB_API_KEY = 'test-api-key'
  process.env.PUBLIC_FB_AUTH_DOMAIN = 'test.firebaseapp.com'
  process.env.PUBLIC_FB_PROJECT_ID = 'test-project'
  process.env.PUBLIC_FB_STORAGE_BUCKET = 'test.appspot.com'
  process.env.PUBLIC_FB_MESSAGING_SENDER_ID = '123456789'
  process.env.PUBLIC_FB_APP_ID = 'test-app-id'
  process.env.PUBLIC_CF_TURNSTILE_SITE_KEY = '1x00000000000000000000AA'
}

/**
 * フレンド申請通知 store をテスト用に読み込む。
 *
 * @returns store モジュール。
 */
const loadFriendRequestNotificationStore = async () => {
  setupStoreTestEnv()
  const cacheKey = `${Date.now()}-${Math.random()}`
  return import(`./friendRequestNotification.ts?cache=${cacheKey}`)
}

test('isFriendRequestNotificationStale: 前回取得から10分未満なら再取得不要になること', async () => {
  // Given: 現在時刻の9分59秒前に取得済み。
  const { isFriendRequestNotificationStale } = await loadFriendRequestNotificationStore()
  const now = Date.parse('2026-07-09T10:10:00.000Z')
  const fetchedAt = '2026-07-09T10:00:01.000Z'

  // When: 再取得期限切れか判定する。
  const stale = isFriendRequestNotificationStale(fetchedAt, now)

  // Then: 10分未満のため再取得不要。
  assert.equal(stale, false)
})

test('isFriendRequestNotificationStale: 前回取得から10分以上なら再取得対象になること', async () => {
  // Given: 現在時刻の10分前に取得済み。
  const { isFriendRequestNotificationStale } = await loadFriendRequestNotificationStore()
  const now = Date.parse('2026-07-09T10:10:00.000Z')
  const fetchedAt = '2026-07-09T10:00:00.000Z'

  // When: 再取得期限切れか判定する。
  const stale = isFriendRequestNotificationStale(fetchedAt, now)

  // Then: 10分以上経過しているため再取得対象。
  assert.equal(stale, true)
})

test('isFriendRequestNotificationStale: 取得時刻がない場合は再取得対象になること', async () => {
  // Given: 取得時刻が未保存。
  const { isFriendRequestNotificationStale } = await loadFriendRequestNotificationStore()

  // When: 再取得期限切れか判定する。
  const stale = isFriendRequestNotificationStale(null)

  // Then: 未取得として再取得対象。
  assert.equal(stale, true)
})

test('syncFriendRequestNotificationFromReceivedCount: 現在の通知対象ユーザーだけ同期すること', async () => {
  // Given: 現在の通知対象ユーザーが alice に設定されている。
  const {
    friendRequestNotification,
    setActiveFriendRequestNotificationUser,
    syncFriendRequestNotificationFromReceivedCount,
  } = await loadFriendRequestNotificationStore()
  setActiveFriendRequestNotificationUser('alice')
  const dataUpdatedAt = Date.parse('2026-07-09T10:00:00.000Z')

  // When: alice の受信申請件数を同期する。
  await syncFriendRequestNotificationFromReceivedCount('alice', 1, dataUpdatedAt)

  // Then: メモリと IndexedDB の通知状態が alice の内容で更新される。
  const cached = await db.friendRequestNotificationStates.get('friendRequestNotification:alice')
  assert.equal(friendRequestNotification.username, 'alice')
  assert.equal(friendRequestNotification.hasPendingReceivedRequest, true)
  assert.equal(friendRequestNotification.fetchedAt, '2026-07-09T10:00:00.000Z')
  assert.equal(cached?.hasPendingReceivedRequest, true)
  assert.equal(cached?.fetchedAt, '2026-07-09T10:00:00.000Z')
})

test('syncFriendRequestNotificationFromReceivedCount: 現在の通知対象でないユーザーは同期しないこと', async () => {
  // Given: 現在の通知対象ユーザーが bob に設定されている。
  const {
    friendRequestNotification,
    setActiveFriendRequestNotificationUser,
    syncFriendRequestNotificationFromReceivedCount,
  } = await loadFriendRequestNotificationStore()
  setActiveFriendRequestNotificationUser('bob')

  // When: alice の受信申請件数同期が遅れて到着する。
  await syncFriendRequestNotificationFromReceivedCount(
    'alice',
    1,
    Date.parse('2026-07-09T10:00:00.000Z')
  )

  // Then: alice の状態はメモリにも IndexedDB にも反映されない。
  const cached = await db.friendRequestNotificationStates.get('friendRequestNotification:alice')
  assert.equal(friendRequestNotification.username, null)
  assert.equal(friendRequestNotification.hasPendingReceivedRequest, false)
  assert.equal(cached, undefined)
})
