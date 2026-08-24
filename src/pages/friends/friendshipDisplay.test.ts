import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatFriendDateTime,
  formatFriendPlayerLevel,
  formatFriendPlayerName,
  formatFriendRating,
  shouldHideFriendProfile,
} from './friendshipDisplay'

test('formatFriendDateTime: 不正な日時はハイフンを返す', () => {
  // Given: API日時として扱えない文字列。
  const value = 'not-a-date'

  // When: フレンド画面用日時へ変換する。
  const result = formatFriendDateTime(value)

  // Then: 不正値は安全な代替表示になる。
  assert.equal(result, '-')
})

test('formatFriendDateTime: null はハイフンを返す', () => {
  // Given: APIが返す未設定日時。
  const value = null

  // When: フレンド画面用日時へ変換する。
  const result = formatFriendDateTime(value)

  // Then: 未設定値は安全な代替表示になる。
  assert.equal(result, '-')
})

test('formatFriendDateTime: 正常なISO日時は日時文字列を返す', () => {
  // Given: APIが返す正常なISO日時。
  const value = '2026-07-08T12:00:00Z'

  // When: フレンド画面用日時へ変換する。
  const result = formatFriendDateTime(value)

  // Then: 有効な日時は代替表示ではなく整形済み文字列になる。
  assert.notEqual(result, '-')
})

test('formatFriendRating: レーティングは小数点以下2桁で表示する', () => {
  // Given: 小数点以下2桁未満のレーティング。
  const rating = 15.2

  // When: フレンド画面用レーティングへ変換する。
  const result = formatFriendRating(rating)

  // Then: 桁数が揃う。
  assert.equal(result, '15.20')
})

test('formatFriendPlayerName: プレイヤー未連携時は未連携を返す', () => {
  // Given: APIが返す未連携状態。
  const playerName = null

  // When: 表示用プレイヤー名へ変換する。
  const result = formatFriendPlayerName(playerName)

  // Then: 未連携であることを短く表示する。
  assert.equal(result, '未連携')
})

test('formatFriendPlayerLevel: プレイヤーレベルを文字列化する', () => {
  // Given: APIが返すプレイヤーレベル。
  const level = 42

  // When: 表示用プレイヤーレベルへ変換する。
  const result = formatFriendPlayerLevel(level)

  // Then: レベル値が文字列で表示できる。
  assert.equal(result, '42')
})

test('formatFriendPlayerLevel: プレイヤー未連携時は未連携を返す', () => {
  // Given: APIが返す未連携状態。
  const level = null

  // When: 表示用プレイヤーレベルへ変換する。
  const result = formatFriendPlayerLevel(level)

  // Then: 未連携であることを短く表示する。
  assert.equal(result, '未連携')
})

test('shouldHideFriendProfile: 非公開ユーザーは未承認中だけプロフィールを隠す', () => {
  // Given: 非公開ユーザーと各フレンド状態。
  const privateUser = { is_private: true }

  // When & Then: 送受信申請では隠し、承認済みフレンドでは表示する。
  assert.equal(shouldHideFriendProfile('received', privateUser), true)
  assert.equal(shouldHideFriendProfile('sent', privateUser), true)
  assert.equal(shouldHideFriendProfile('friends', privateUser), false)
})

test('shouldHideFriendProfile: 公開ユーザーは未承認中でもプロフィールを表示する', () => {
  // Given: 公開ユーザー。
  const publicUser = { is_private: false }

  // When & Then: 送受信申請でもプロフィールを表示する。
  assert.equal(shouldHideFriendProfile('received', publicUser), false)
  assert.equal(shouldHideFriendProfile('sent', publicUser), false)
})
