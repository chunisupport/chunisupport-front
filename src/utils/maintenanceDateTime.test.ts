import assert from 'node:assert/strict'
import test from 'node:test'
import { formatMaintenanceDateTime } from './maintenanceDateTime'

test('UTC日時をJST固定かつ秒ありで表示すること', () => {
  // Given
  const value = '2026-07-26T12:30:45Z'

  // When
  const result = formatMaintenanceDateTime(value)

  // Then
  assert.equal(result, '2026/07/26 21:30:45')
})

test('APIが返すタイムゾーン付き日時を同じ瞬間のJSTで表示すること', () => {
  // Given
  const value = '2026-07-26T12:30:45+09:00'

  // When
  const result = formatMaintenanceDateTime(value)

  // Then
  assert.equal(result, '2026/07/26 12:30:45')
})

test('JSTの午前0時を24時ではなく00時で表示すること', () => {
  // Given
  const value = '2026-07-25T15:00:00Z'

  // When
  const result = formatMaintenanceDateTime(value)

  // Then
  assert.equal(result, '2026/07/26 00:00:00')
})

test('null、空文字、不正な日時はnullを返すこと', () => {
  // Given
  const values = [null, '', 'not-a-date']

  // When
  const results = values.map((value) => formatMaintenanceDateTime(value))

  // Then
  assert.deepEqual(results, [null, null, null])
})
