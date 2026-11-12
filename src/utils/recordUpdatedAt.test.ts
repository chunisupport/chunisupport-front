import assert from 'node:assert/strict'
import test from 'node:test'
import {
  compareUpdatedAtWithMissingLast,
  formatUpdatedAt,
  hasValidUpdatedAtTimestamp,
  updatedAtTimestamp,
} from './recordUpdatedAt.ts'

test('更新日をyy/mm/dd形式で表示する', () => {
  assert.equal(formatUpdatedAt('2026-04-14T11:22:33Z'), '26/04/14')
})

test('更新日は日本時間基準の日付で表示する', () => {
  assert.equal(formatUpdatedAt('2026-05-31T14:59:59Z'), '26/05/31')
  assert.equal(formatUpdatedAt('2026-05-31T15:00:00Z'), '26/06/01')
})

test('カレンダー上に存在しない更新日はハイフンを返す', () => {
  assert.equal(formatUpdatedAt('2026-99-99T00:00:00Z'), '-')
  assert.equal(formatUpdatedAt('2026-02-30'), '-')
})

test('更新日が未設定や不正な場合はハイフンを返す', () => {
  assert.equal(formatUpdatedAt(null), '-')
  assert.equal(formatUpdatedAt('invalid'), '-')
})

test('更新日のソート値はUNIXエポックからのミリ秒になる', () => {
  // Given: UTCと日本時間で表した同じ既知日時
  const utc = '2026-01-01T00:00:00Z'
  const jst = '2026-01-01T09:00:00+09:00'

  // When
  const utcTimestamp = updatedAtTimestamp(utc)
  const jstTimestamp = updatedAtTimestamp(jst)

  // Then: 秒や日付ではなくミリ秒単位の同じ値になる
  assert.equal(utcTimestamp, 1_767_225_600_000)
  assert.equal(jstTimestamp, 1_767_225_600_000)
})

test('更新日のソート値は新しい日時ほど大きくなる', () => {
  // Given / When
  const older = updatedAtTimestamp('2025-01-01T00:00:00Z')
  const newer = updatedAtTimestamp('2026-01-01T00:00:00Z')

  // Then
  assert.ok(newer > older)
})

test('更新日が未設定のソート値は負の無限大になる', () => {
  // Given / When
  const missing = updatedAtTimestamp(null)

  // Then
  assert.equal(missing, Number.NEGATIVE_INFINITY)
})

test('不正な更新日は未設定として扱う', () => {
  const invalid = updatedAtTimestamp('invalid-date')

  assert.equal(invalid, Number.NEGATIVE_INFINITY)
  assert.equal(hasValidUpdatedAtTimestamp(invalid), false)
  assert.equal(hasValidUpdatedAtTimestamp(updatedAtTimestamp('2026-01-01T00:00:00Z')), true)
})

test('更新日比較は未プレイ/無効日付を末尾固定する', () => {
  const played = { isPlayed: true, updatedAtTimestamp: updatedAtTimestamp('2026-01-01T00:00:00Z') }
  const unplayed = { isPlayed: false, updatedAtTimestamp: Number.NEGATIVE_INFINITY }
  const invalidDate = { isPlayed: true, updatedAtTimestamp: Number.NEGATIVE_INFINITY }

  assert.equal(compareUpdatedAtWithMissingLast(unplayed, played), 1)
  assert.equal(compareUpdatedAtWithMissingLast(played, unplayed), -1)
  assert.equal(compareUpdatedAtWithMissingLast(invalidDate, unplayed), 0)
})

test('右側だけ日時が無効なら左側を先と判定すること', () => {
  // Given: 左は有効日時、右はプレイ済みだが日時が無効な状態がある。
  const left = { isPlayed: true, updatedAtTimestamp: updatedAtTimestamp('2026-01-01T00:00:00Z') }
  const right = { isPlayed: true, updatedAtTimestamp: Number.NEGATIVE_INFINITY }

  // When: 更新日を比較する。
  const result = compareUpdatedAtWithMissingLast(left, right)

  // Then: 右が末尾になるため負数が返る。
  assert.equal(result, -1)
})

test('有効な更新日が異なれば前後関係を返すこと', () => {
  // Given: 更新日が異なるプレイ済みレコードがある。
  const older = { isPlayed: true, updatedAtTimestamp: updatedAtTimestamp('2025-01-01T00:00:00Z') }
  const newer = { isPlayed: true, updatedAtTimestamp: updatedAtTimestamp('2026-01-01T00:00:00Z') }

  // When: 更新日を比較する。
  const forward = compareUpdatedAtWithMissingLast(older, newer)
  const backward = compareUpdatedAtWithMissingLast(newer, older)

  // Then: 古い順に負数と正数が返る。
  assert.equal(forward < 0, true)
  assert.equal(backward > 0, true)
})
