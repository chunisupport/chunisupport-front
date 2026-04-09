import assert from 'node:assert/strict'
import { test } from 'node:test'
import { shouldShowProfileScrollToTop } from './scrollToTopVisibility.ts'

test('レーティングタブ(ベスト枠)ではスクロールトップボタンを表示しない', () => {
  assert.equal(shouldShowProfileScrollToTop('rating_best'), false)
})

test('レーティングタブ(新曲枠)ではスクロールトップボタンを表示しない', () => {
  assert.equal(shouldShowProfileScrollToTop('rating_new'), false)
})

test('レコードタブとOVER POWERタブではスクロールトップボタンを表示する', () => {
  assert.equal(shouldShowProfileScrollToTop('record_normal'), true)
  assert.equal(shouldShowProfileScrollToTop('record_we'), true)
  assert.equal(shouldShowProfileScrollToTop('overpower'), true)
})
