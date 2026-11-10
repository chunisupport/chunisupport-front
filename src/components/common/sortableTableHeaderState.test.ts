import assert from 'node:assert/strict'
import test from 'node:test'

import { getSortAriaValue } from './sortableTableHeaderState.ts'

test('非アクティブ列はaria-sortのnoneを返すこと', () => {
  // Given: ソート方向を持つが現在のソート対象ではない列
  const active = false
  const direction = 'asc'

  // When: aria-sort値へ変換する
  const result = getSortAriaValue(active, direction)

  // Then: ソート対象外としてnoneが返る
  assert.equal(result, 'none')
})

test('アクティブ列でもソート方向がない場合はaria-sortのnoneを返すこと', () => {
  // Given: 現在のソート対象だが解除状態の列
  const active = true
  const direction = null

  // When: aria-sort値へ変換する
  const result = getSortAriaValue(active, direction)

  // Then: ソート方向なしとしてnoneが返る
  assert.equal(result, 'none')
})

test('アクティブ列の昇順はaria-sortのascendingを返すこと', () => {
  // Given: 昇順でソート中の列
  const active = true
  const direction = 'asc'

  // When: aria-sort値へ変換する
  const result = getSortAriaValue(active, direction)

  // Then: ascendingが返る
  assert.equal(result, 'ascending')
})

test('アクティブ列の降順はaria-sortのdescendingを返すこと', () => {
  // Given: 降順でソート中の列
  const active = true
  const direction = 'desc'

  // When: aria-sort値へ変換する
  const result = getSortAriaValue(active, direction)

  // Then: descendingが返る
  assert.equal(result, 'descending')
})
