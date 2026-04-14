import assert from 'node:assert/strict'
import test from 'node:test'
import { formatUpdatedAt, updatedAtTimestamp } from './updatedAt.ts'

test('更新日をyy/mm/dd形式で表示する', () => {
  assert.equal(formatUpdatedAt('2026-04-14T11:22:33Z'), '26/04/14')
})

test('更新日が未設定や不正な場合はハイフンを返す', () => {
  assert.equal(formatUpdatedAt(null), '-')
  assert.equal(formatUpdatedAt('invalid'), '-')
})

test('更新日のソート値は新しい日時ほど大きくなる', () => {
  const older = updatedAtTimestamp('2025-01-01T00:00:00Z')
  const newer = updatedAtTimestamp('2026-01-01T00:00:00Z')

  assert.ok(newer > older)
  assert.equal(updatedAtTimestamp(null), Number.NEGATIVE_INFINITY)
})
