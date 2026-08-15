import assert from 'node:assert/strict'
import test from 'node:test'
import { formatSettingsDateTime } from './settingsDateTime'

test('設定日時は未登録値に指定した代替文言を返す', () => {
  // Given: 未登録日時と表示したい代替文言。
  const value = null

  // When: 設定画面用に日時を整形する。
  const result = formatSettingsDateTime(value, '未使用')

  // Then: 指定した代替文言を返す。
  assert.equal(result, '未使用')
})

test('設定日時は不正な日時文字列を未登録として扱う', () => {
  // Given: 解釈できない日時文字列。
  const value = 'invalid-date'

  // When: 設定画面用に日時を整形する。
  const result = formatSettingsDateTime(value)

  // Then: 既定の未登録文言を返す。
  assert.equal(result, '未登録')
})
