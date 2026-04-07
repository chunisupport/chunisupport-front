import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveNavBarVisibility } from './navBarVisibility.ts'

test('先頭付近では常にナビゲーションバーを表示する', () => {
  assert.equal(
    resolveNavBarVisibility({
      previousScrollTop: 40,
      currentScrollTop: 10,
      isVisible: false,
    }),
    true
  )
})

test('下方向にスクロールするとナビゲーションバーを非表示にする', () => {
  assert.equal(
    resolveNavBarVisibility({
      previousScrollTop: 120,
      currentScrollTop: 180,
      isVisible: true,
    }),
    false
  )
})

test('上方向にスクロールするとナビゲーションバーを表示する', () => {
  assert.equal(
    resolveNavBarVisibility({
      previousScrollTop: 220,
      currentScrollTop: 160,
      isVisible: false,
    }),
    true
  )
})

test('しきい値未満のスクロール変化では表示状態を維持する', () => {
  assert.equal(
    resolveNavBarVisibility({
      previousScrollTop: 100,
      currentScrollTop: 104,
      isVisible: true,
    }),
    true
  )
  assert.equal(
    resolveNavBarVisibility({
      previousScrollTop: 100,
      currentScrollTop: 104,
      isVisible: false,
    }),
    false
  )
})
