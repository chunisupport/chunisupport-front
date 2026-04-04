import assert from 'node:assert/strict'
import test from 'node:test'

import { formatPlayerUpdatedAt } from './adminUserDisplay.ts'

test('プレイヤーデータ更新日時が null の場合はハイフンを返す', () => {
  assert.equal(formatPlayerUpdatedAt(null), '-')
})

test('ISO 文字列のプレイヤーデータ更新日時を ja-JP で表示する', () => {
  const formatted = formatPlayerUpdatedAt('2026-03-31T10:20:30Z')

  assert.match(formatted, /^2026\/3\/31\s19:20:30$/)
})

test('不正な日時文字列はハイフンを返す', () => {
  assert.equal(formatPlayerUpdatedAt('not-a-date'), '-')
})
