import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { sortHeaderLabelClass } from './sortHeaderColor.ts'

test('非アクティブ列はグレーの文字色になる', () => {
  assert.equal(sortHeaderLabelClass('score', 'asc', 'title'), 'text-gray-700')
})

test('昇順ソート中の列は赤系の文字色になる', () => {
  assert.equal(sortHeaderLabelClass('score', 'asc', 'score'), 'text-rose-600')
})

test('降順ソート中の列は青系の文字色になる', () => {
  assert.equal(sortHeaderLabelClass('score', 'desc', 'score'), 'text-sky-600')
})

test('ソート解除時はグレーの文字色になる', () => {
  assert.equal(sortHeaderLabelClass(null, null, 'score'), 'text-gray-700')
})
