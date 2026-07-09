import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFriendsTabOptions, buildFriendsTabPath, resolveFriendsTabValue } from './constants'

test('buildFriendsTabPath: フレンド画面タブに対応するURLを生成する', () => {
  // Given: フレンド画面の各タブ値。
  const friendsTab = 'friends'
  const receivedTab = 'received'
  const sentTab = 'sent'

  // When: タブ値からURLを生成する。
  const friendsPath = buildFriendsTabPath(friendsTab)
  const receivedPath = buildFriendsTabPath(receivedTab)
  const sentPath = buildFriendsTabPath(sentTab)

  // Then: タブに対応したURLパスが返る。
  assert.equal(friendsPath, '/friends')
  assert.equal(receivedPath, '/friends/receive')
  assert.equal(sentPath, '/friends/request')
})

test('resolveFriendsTabValue: URLセグメントからフレンド画面タブ値を復元する', () => {
  // Given: フレンド画面のURLセグメント。
  const rootSegment = undefined
  const receivedSegment = 'receive'
  const sentSegment = 'request'
  const unknownSegment = 'unknown'

  // When: URLセグメントからタブ値を復元する。
  const rootTab = resolveFriendsTabValue(rootSegment)
  const receivedTab = resolveFriendsTabValue(receivedSegment)
  const sentTab = resolveFriendsTabValue(sentSegment)
  const unknownTab = resolveFriendsTabValue(unknownSegment)

  // Then: 対応するタブ値、または未対応を表す null が返る。
  assert.equal(rootTab, 'friends')
  assert.equal(receivedTab, 'received')
  assert.equal(sentTab, 'sent')
  assert.equal(unknownTab, null)
})

test('buildFriendsTabOptions: 受付中タブだけ通知ドット状態を反映する', () => {
  // Given: 受信済みフレンド申請がある状態。
  const hasPendingReceivedRequest = true

  // When: フレンド画面タブ選択肢を生成する。
  const options = buildFriendsTabOptions(hasPendingReceivedRequest)

  // Then: 受付中タブだけ通知ドット表示対象になる。
  assert.deepEqual(
    options.map((option) => ({
      value: option.value,
      hasNotificationDot: option.hasNotificationDot ?? false,
    })),
    [
      { value: 'friends', hasNotificationDot: false },
      { value: 'received', hasNotificationDot: true },
      { value: 'sent', hasNotificationDot: false },
    ]
  )
})
