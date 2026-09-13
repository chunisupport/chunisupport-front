import assert from 'node:assert/strict'
import test from 'node:test'
import { formatApiTokenPermission } from './ApiTokenSettings.constants.ts'

test('APIトークン権限を日本語の表示名に変換すること', () => {
  // Given: APIが返すすべてのAPIトークン権限。
  const permissions = ['read', 'read_write'] as const

  // When: 設定画面用の表示名に変換する。
  const labels = permissions.map(formatApiTokenPermission)

  // Then: 読み取り専用と更新可能を判別できる文言になる。
  assert.deepEqual(labels, ['読み取り', '読み取り・書き込み'])
})
