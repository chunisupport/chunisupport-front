import assert from 'node:assert/strict'
import test from 'node:test'

import { formatAdminUserDateTime, formatBooleanFlag } from './adminUserDisplay.ts'

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

test('boolean フラグは true/false 文字列に変換する', () => {
  assert.equal(formatBooleanFlag(true), 'true')
  assert.equal(formatBooleanFlag(false), 'false')
})
