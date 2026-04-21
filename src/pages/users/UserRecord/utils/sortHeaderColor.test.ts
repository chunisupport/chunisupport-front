import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { sortHeaderLabelClass } from './sortHeaderColor.ts'

test('非アクティブ列はグレーの文字色になる', () => {
  assert.equal(sortHeaderLabelClass('score', 'asc', 'title'), 'text-gray-700')
})

test('昇順ソート中の列はスカイブルーの文字色になる', () => {
  assert.equal(sortHeaderLabelClass('score', 'asc', 'score'), 'text-sky-600')
})

test('降順ソート中の列はインディゴの文字色になる', () => {
  assert.equal(sortHeaderLabelClass('score', 'desc', 'score'), 'text-indigo-600')
})

test('ソート解除時はグレーの文字色になる', () => {
  assert.equal(sortHeaderLabelClass(null, null, 'score'), 'text-gray-700')
})
