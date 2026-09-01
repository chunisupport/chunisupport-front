import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { CLIENT_CACHE_SCHEMA_VERSION, db } from '../lib/db/cacheDB.ts'
import {
  clearFriendRequestNotificationState,
  clearFriendRequestNotificationStates,
  readFriendRequestNotificationState,
  saveFriendRequestNotificationState,
} from './friendRequestNotificationRepository.ts'

afterEach(async () => {
  await clearFriendRequestNotificationStates()
})

test('フレンド申請通知状態はユーザー単位で保存して読み込めること', async () => {
  // Given: alice に未処理申請あり、bob に未処理申請なしの通知状態を保存する。
  await saveFriendRequestNotificationState('alice', true, '2026-07-09T10:00:00.000Z')
  await saveFriendRequestNotificationState('bob', false, '2026-07-09T10:05:00.000Z')

  // When: alice の通知状態を読み込む。
  const state = await readFriendRequestNotificationState('alice')

  // Then: alice の状態だけが取得される。
  assert.deepEqual(state, {
    key: 'friendRequestNotification:alice',
    username: 'alice',
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
    hasPendingReceivedRequest: true,
    fetchedAt: '2026-07-09T10:00:00.000Z',
  })
})

test('フレンド申請通知状態は旧スキーマの場合は読み込まれないこと', async () => {
  // Given: 旧スキーマの通知状態が保存されている。
  await db.friendRequestNotificationStates.put({
    key: 'friendRequestNotification:alice',
    username: 'alice',
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION - 1,
    hasPendingReceivedRequest: true,
    fetchedAt: '2026-07-09T10:00:00.000Z',
  })

  // When: alice の通知状態を読み込む。
  const state = await readFriendRequestNotificationState('alice')

  // Then: 旧スキーマの状態は利用されない。
  assert.equal(state, null)
})

test('指定ユーザーのフレンド申請通知状態だけを削除できること', async () => {
  // Given: alice と bob の通知状態を保存する。
  await saveFriendRequestNotificationState('alice', true, '2026-07-09T10:00:00.000Z')
  await saveFriendRequestNotificationState('bob', false, '2026-07-09T10:05:00.000Z')

  // When: alice の通知状態だけを削除する。
  await clearFriendRequestNotificationState('alice')

  // Then: alice は削除され、bob は保持される。
  assert.equal(await readFriendRequestNotificationState('alice'), null)
  assert.notEqual(await readFriendRequestNotificationState('bob'), null)
})
