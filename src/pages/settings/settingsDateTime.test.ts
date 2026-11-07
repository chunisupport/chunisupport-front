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

test('設定日時は実行環境のタイムゾーンによらずJSTの年月日時分で表示する', () => {
  // Given: UTCで表したAPI日時。
  const value = '2026-07-26T12:30:45Z'

  // When: 設定画面用に日時を整形する。
  const result = formatSettingsDateTime(value)

  // Then: JSTへ変換した年月日時分を返す。
  assert.equal(result, '2026/07/26 21:30')
})

test('設定日時はJSTの午前0時を00時として表示する', () => {
  // Given: JSTでは翌日の午前0時になるUTC日時。
  const value = '2026-07-25T15:00:00Z'

  // When: 設定画面用に日時を整形する。
  const result = formatSettingsDateTime(value)

  // Then: JSTの日付と00時で表示する。
  assert.equal(result, '2026/07/26 00:00')
})
