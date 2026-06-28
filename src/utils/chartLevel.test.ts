import assert from 'node:assert/strict'
import test from 'node:test'

import { getChartLevelSortKey, isLowChartLevel, toChartLevelLabel } from './chartLevel.ts'

test('譜面定数の小数第1位が.5未満なら整数レベルを返す', () => {
  assert.equal(toChartLevelLabel(10.0), '10')
  assert.equal(toChartLevelLabel(10.4), '10')
})

test('譜面定数の小数第1位が.5以上ならプラス付きレベルを返す', () => {
  assert.equal(toChartLevelLabel(10.5), '10+')
  assert.equal(toChartLevelLabel(10.9), '10+')
  assert.equal(toChartLevelLabel(14.5), '14+')
})

test('10未満のプラス付きレベルを低レベルとして判定する', () => {
  assert.equal(toChartLevelLabel(9.5), '9+')
  assert.equal(isLowChartLevel('9+'), true)
  assert.equal(isLowChartLevel('10'), false)
})

test('表示レベルのソートキーはプラスなし、プラス付きの順に並ぶ', () => {
  assert.ok(getChartLevelSortKey('10') < getChartLevelSortKey('10+'))
  assert.ok(getChartLevelSortKey('10+') < getChartLevelSortKey('11'))
})
