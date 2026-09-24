import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildFriendCardDisplay,
  formatFriendDateTime,
  formatFriendOverPowerValue,
  formatFriendPlayerName,
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

test('formatFriendOverPowerValue: OVER POWER値は小数点以下3桁で表示する', () => {
  // Given: 小数点以下3桁未満のOVER POWER値。
  const value = 31234.5

  // When: フレンド画面用OVER POWER値へ変換する。
  const result = formatFriendOverPowerValue(value)

  // Then: プロフィールカードと同じ桁数に揃う。
  assert.equal(result, '31234.500')
})

test('formatFriendOverPowerValue: プレイヤー未連携時はハイフンを返す', () => {
  // Given: APIが返す未連携状態。
  const value = null

  // When: フレンド画面用OVER POWER値へ変換する。
  const result = formatFriendOverPowerValue(value)

  // Then: 未設定値は安全な代替表示になる。
  assert.equal(result, '-')
})

test('formatFriendPlayerName: プレイヤー未連携時は未連携を返す', () => {
  // Given: APIが返す未連携状態。
  const playerName = null

  // When: 表示用プレイヤー名へ変換する。
  const result = formatFriendPlayerName(playerName)

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

test('buildFriendCardDisplay: 公開ユーザーは各値を整形して表示する', () => {
  // Given: プレイヤー連携済みのユーザー概要。
  const user = { player_level: 42, player_name: 'PLAYER', rating: 17.25, overpower_value: 31234.5 }

  // When: カード表示用の値を生成する。
  const result = buildFriendCardDisplay(user, false)

  // Then: プロフィールカードと同じ桁数で整形される。
  assert.deepEqual(result, {
    level: '42',
    playerName: 'PLAYER',
    rating: '17.2500',
    overPower: '31234.500',
  })
})

test('buildFriendCardDisplay: プレイヤー未連携時は未連携とハイフンを表示する', () => {
  // Given: プレイヤー未連携のユーザー概要。
  const user = { player_level: null, player_name: null, rating: null, overpower_value: null }

  // When: カード表示用の値を生成する。
  const result = buildFriendCardDisplay(user, false)

  // Then: 名前は未連携、数値はハイフンになる。
  assert.deepEqual(result, { level: '-', playerName: '未連携', rating: '-', overPower: '-' })
})

test('buildFriendCardDisplay: プロフィールを隠す場合は値があっても全項目を伏せ字にする', () => {
  // Given: 値を持つユーザー概要。
  const user = { player_level: 42, player_name: 'PLAYER', rating: 17.25, overpower_value: 31234.5 }

  // When: 非表示指定でカード表示用の値を生成する。
  const result = buildFriendCardDisplay(user, true)

  // Then: すべて伏せ字になる。
  assert.deepEqual(result, {
    level: '***',
    playerName: '＊＊＊＊＊＊＊＊',
    rating: '****',
    overPower: '****',
  })
})
