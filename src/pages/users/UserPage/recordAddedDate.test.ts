import assert from 'node:assert/strict'
import test from 'node:test'
import { formatRecordAddedDate } from './recordAddedDate.ts'

test('楽曲追加日文字列をYY/MM/DD形式へ変換する', () => {
  assert.equal(formatRecordAddedDate('2026-04-13'), '26/04/13')
})

test('楽曲追加日がnullまたは不正値ならハイフンを返す', () => {
  assert.equal(formatRecordAddedDate(null), '-')
  assert.equal(formatRecordAddedDate('invalid-date'), '-')
})
