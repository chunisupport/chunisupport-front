import assert from 'node:assert/strict'
import test from 'node:test'
import type { AdminUserListResponse } from '../../types/api.ts'

import {
  formatAccountType,
  formatAdminUserDateTime,
  formatNullableText,
  updateAdminUserListRow,
} from './adminUserDisplay.ts'

test('管理ユーザー日時が null の場合はハイフンを返す', () => {
  assert.equal(formatAdminUserDateTime(null), '-')
})

test('ISO 文字列の管理ユーザー日時を ja-JP で表示する', () => {
  const formatted = formatAdminUserDateTime('2026-03-31T10:20:30Z')

  assert.match(formatted, /^2026\/3\/31\s19:20:30$/)
})

test('不正な日時文字列はハイフンを返す', () => {
  assert.equal(formatAdminUserDateTime('not-a-date'), '-')
})

test('account_type は定義済み値をそのまま表示する', () => {
  assert.equal(formatAccountType('ADMIN'), 'ADMIN')
  assert.equal(formatAccountType('PLAYER'), 'PLAYER')
  assert.equal(formatAccountType('EDITOR'), 'EDITOR')
  assert.equal(formatAccountType('EXTDEV'), 'EXTDEV')
})

test('nullable text は null と空文字でハイフンを返す', () => {
  assert.equal(formatNullableText(null), '-')
  assert.equal(formatNullableText(''), '-')
  assert.equal(formatNullableText('るなぁぁ'), 'るなぁぁ')
})

test('ユーザー一覧は対象行の指定フィールドだけを更新し、行順と他の行を維持する', () => {
  // Given
  const alice: AdminUserListResponse = {
    username: 'alice',
    account_type: 'PLAYER',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    player_name: 'ALICE',
    rating: 16,
    overpower_value: 100,
    is_suspicious: false,
    is_private: false,
  }
  const bob: AdminUserListResponse = {
    ...alice,
    username: 'bob',
    player_name: 'BOB',
  }

  // When
  const result = updateAdminUserListRow([alice, bob], 'bob', {
    account_type: 'EDITOR',
    is_suspicious: true,
  })

  // Then
  assert.deepEqual(
    result.map((user) => user.username),
    ['alice', 'bob']
  )
  assert.equal(result[0], alice)
  assert.deepEqual(result[1], {
    ...bob,
    account_type: 'EDITOR',
    is_suspicious: true,
  })
})
