import assert from 'node:assert/strict'
import test from 'node:test'
import { formatFileTimestamp } from './localDateTime'

test('ファイル名用の日時は区切りなしのローカル時刻でゼロ埋めされること', () => {
  // Given: 1桁の月日時分秒を含むローカル日時
  const date = new Date(2026, 0, 2, 3, 4, 5)

  // When
  const result = formatFileTimestamp(date)

  // Then
  assert.equal(result, '20260102030405')
})

test('ファイル名用の日時は指定した区切りを日付と時刻の間に入れること', () => {
  // Given
  const date = new Date(2026, 11, 31, 23, 59, 58)

  // When
  const result = formatFileTimestamp(date, '-')

  // Then
  assert.equal(result, '20261231-235958')
})
