import assert from 'node:assert/strict'
import test from 'node:test'
import { formatApiTokenPermission, formatApiTokenPublicOnly } from './ApiTokenSettings.constants.ts'

test('APIトークン権限を日本語の表示名に変換すること', () => {
  // Given: APIが返すすべてのAPIトークン権限。
  const permissions = ['read', 'read_write'] as const

  // When: 設定画面用の表示名に変換する。
  const labels = permissions.map(formatApiTokenPermission)

  // Then: 読み取り専用と更新可能を判別できる文言になる。
  assert.deepEqual(labels, ['読み取り', '読み取り・書き込み'])
})

test('APIトークンの参照範囲を日本語の表示名に変換すること', () => {
  // Given: APIが返す public_only の両方の値。
  const values = [true, false]

  // When: 設定画面用の表示名に変換する。
  const labels = values.map(formatApiTokenPublicOnly)

  // Then: 公開ユーザーのみかどうかを判別できる文言になる。
  assert.deepEqual(labels, ['公開ユーザーのみ', '公開ユーザー＋フレンド'])
})
