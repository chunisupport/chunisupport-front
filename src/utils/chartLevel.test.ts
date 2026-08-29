import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getChartLevelConstRange,
  getChartLevelSortKey,
  isLowChartLevel,
  toChartLevelLabel,
} from './chartLevel'

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

test('表示レベルを対応する譜面定数範囲へ変換する', () => {
  // Given, When & Then
  assert.deepEqual(getChartLevelConstRange('6'), { min: 6, max: 6.4 })
  assert.deepEqual(getChartLevelConstRange('6+'), { min: 6.5, max: 6.9 })
  assert.deepEqual(getChartLevelConstRange('14'), { min: 14, max: 14.4 })
  assert.deepEqual(getChartLevelConstRange('14+'), { min: 14.5, max: 14.9 })
  assert.deepEqual(getChartLevelConstRange('16'), { min: 16, max: 16 })
})
