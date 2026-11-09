import assert from 'node:assert/strict'
import test from 'node:test'
import { formatJstCompactDate, formatJstDateTime, formatJstDateTimeMinute } from './jstDateTime'

test('UTC日時をJSTの区切りなし年月日へ整形し、日付をまたぐ場合は翌日になること', () => {
  // Given
  const value = '2026-11-08T15:00:00Z'

  // When
  const result = formatJstCompactDate(value)

  // Then
  assert.equal(result, '20261109')
})

test('区切りなし年月日は不正な日時やnullでnullを返すこと', () => {
  // Given & When & Then
  assert.equal(formatJstCompactDate('invalid'), null)
  assert.equal(formatJstCompactDate(null), null)
})

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

test('UNIXエポックからの経過ミリ秒もJST固定で表示すること', () => {
  // Given
  const value = Date.UTC(2026, 6, 26, 12, 30, 45)

  // When
  const result = formatJstDateTime(value)

  // Then
  assert.equal(result, '2026/07/26 21:30:45')
})

test('分単位の整形ではJST固定かつ秒なしで表示すること', () => {
  // Given: JSTでは翌日の午前0時台になるUTC日時。
  const values = ['2026-07-25T15:05:45Z', Date.UTC(2026, 6, 25, 15, 5, 45)]

  // When
  const results = values.map((value) => formatJstDateTimeMinute(value))

  // Then
  assert.deepEqual(results, ['2026/07/26 00:05', '2026/07/26 00:05'])
})

test('分単位の整形でもnull、空文字、不正な日時はnullを返すこと', () => {
  // Given
  const values = [null, '', 'not-a-date', Number.NaN]

  // When
  const results = values.map((value) => formatJstDateTimeMinute(value))

  // Then
  assert.deepEqual(results, [null, null, null, null])
})
