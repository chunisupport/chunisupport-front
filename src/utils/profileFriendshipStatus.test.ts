import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveProfileFriendshipStatus } from './profileFriendshipStatus'

test('resolveProfileFriendshipStatus: 一覧にいないユーザーは未申請になる', () => {
  // Given: 対象ユーザーを含まないフレンド関係。
  const friends = [{ username: 'bob' }]
  const sentRequests = [{ username: 'carol' }]
  const receivedRequests = [{ username: 'dave' }]

  // When: 表示中ユーザーの関係を解決する。
  const result = resolveProfileFriendshipStatus('alice', friends, sentRequests, receivedRequests)

  // Then: 申請前の状態になる。
  assert.equal(result, 'none')
})

test('resolveProfileFriendshipStatus: ユーザー名は完全一致で判定する', () => {
  // Given: 対象ユーザー名を前方一致するだけの一覧。
  const friends = [{ username: 'alice2' }]

  // When: 表示中ユーザーの関係を解決する。
  const result = resolveProfileFriendshipStatus('alice', friends, [], [])

  // Then: 部分一致ではフレンドにしない。
  assert.equal(result, 'none')
})

test('resolveProfileFriendshipStatus: 送信済み申請は申請中になる', () => {
  // Given: 対象ユーザーへの送信済み申請。
  const sentRequests = [{ username: 'alice' }]

  // When: 表示中ユーザーの関係を解決する。
  const result = resolveProfileFriendshipStatus('alice', [], sentRequests, [])

  // Then: 申請中の状態になる。
  assert.equal(result, 'sent')
})

test('resolveProfileFriendshipStatus: 受信済み申請は受付中になる', () => {
  // Given: 対象ユーザーからの受信済み申請。
  const receivedRequests = [{ username: 'alice' }]

  // When: 表示中ユーザーの関係を解決する。
  const result = resolveProfileFriendshipStatus('alice', [], [], receivedRequests)

  // Then: 受付中の状態になる。
  assert.equal(result, 'received')
})

test('resolveProfileFriendshipStatus: 承認済みフレンドを申請より優先する', () => {
  // Given: 同じユーザーが複数の一覧に含まれる。
  const users = [{ username: 'alice' }]

  // When: 表示中ユーザーの関係を解決する。
  const result = resolveProfileFriendshipStatus('alice', users, users, users)

  // Then: 承認済み関係を優先する。
  assert.equal(result, 'friend')
})

test('resolveProfileFriendshipStatus: 送信済み申請を受信済み申請より優先する', () => {
  // Given: 送受信の両方に同じユーザーが含まれる。
  const users = [{ username: 'alice' }]

  // When: 表示中ユーザーの関係を解決する。
  const result = resolveProfileFriendshipStatus('alice', [], users, users)

  // Then: 自分が送った申請を優先する。
  assert.equal(result, 'sent')
})
