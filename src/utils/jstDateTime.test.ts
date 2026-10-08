import assert from 'node:assert/strict'
import test from 'node:test'
import { formatJstDateTime, toJstDateString } from './jstDateTime'

test('UTC日時をJST固定かつ秒ありで表示すること', () => {
  // Given
  const value = '2026-07-26T12:30:45Z'

  // When
  const result = formatJstDateTime(value)

  // Then
  assert.equal(result, '2026/07/26 21:30:45')
})

test('JSTの午前0時を24時ではなく00時で表示すること', () => {
  // Given
  const value = '2026-07-25T15:00:00Z'

  // When
  const result = formatJstDateTime(value)

  // Then
  assert.equal(result, '2026/07/26 00:00:00')
})

test('null、空文字、不正な日時はnullを返すこと', () => {
  // Given
  const values = [null, '', 'not-a-date']

  // When
  const results = values.map((value) => formatJstDateTime(value))

  // Then
  assert.deepEqual(results, [null, null, null])
})

test('UTC日時をJSTの日付へ変換すること', () => {
  // Given: JSTでは翌日になるUTC日時
  const value = '2026-07-25T15:00:00Z'

  // When
  const result = toJstDateString(value)

  // Then
  assert.equal(result, '2026-07-26')
})

test('JSTオフセット付き日時はそのままの日付を返すこと', () => {
  // Given
  const value = '2025-11-02T16:42:00+09:00'

  // When
  const result = toJstDateString(value)

  // Then
  assert.equal(result, '2025-11-02')
})

test('日付変換でもnull、空文字、不正な日時はnullを返すこと', () => {
  // Given
  const values = [null, '', 'not-a-date']

  // When
  const results = values.map((value) => toJstDateString(value))

  // Then
  assert.deepEqual(results, [null, null, null])
})
