import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getChartLevelConstRange,
  getChartLevelFilterBoundary,
  getChartLevelSortKey,
  isChartConstRangeModified,
  isChartLevelFilterRange,
  isLowChartLevel,
  normalizeChartConstRange,
  toChartLevelFilterLabel,
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

test('フィルター用レベルは6以下をプラスなしで表す', () => {
  // Given, When & Then
  assert.equal(toChartLevelFilterLabel(6.9), '6')
  assert.equal(toChartLevelFilterLabel(7.5), '7+')
})

test('フィルター用レベルの下限と上限を譜面定数へ変換する', () => {
  // Given, When & Then
  assert.equal(getChartLevelFilterBoundary('6', 'min'), 6)
  assert.equal(getChartLevelFilterBoundary('6', 'max'), 6.9)
  assert.equal(getChartLevelFilterBoundary('14+', 'min'), 14.5)
  assert.equal(getChartLevelFilterBoundary('14+', 'max'), 14.9)
  assert.equal(getChartLevelFilterBoundary('16', 'max'), 16)
})

test('逆順のレベル範囲はレベル全体を含む昇順の定数範囲として適用する', () => {
  // Given: 開始14+、終了13の選択を定数へ変換した範囲。
  const range = { min: 14.5, max: 13.4 }
  // When: 設定ダイアログの適用用に正規化する。
  const result = normalizeChartConstRange(range, 'level')
  // Then: 数値の入れ替えだけでなく、開始13・終了14+の全体を含む。
  assert.deepEqual(result, { min: 13, max: 14.9 })
  assert.equal(toChartLevelFilterLabel(result.min), '13')
  assert.equal(toChartLevelFilterLabel(result.max), '14+')
  assert.deepEqual(normalizeChartConstRange(result, 'level'), result)
  assert.deepEqual(range, { min: 14.5, max: 13.4 })
})

test('数値指定の適用はレベル境界へ丸めず端点の順序だけ揃える', () => {
  // Given: レベル境界に一致しない逆順の数値範囲。
  const range = { min: 14.2, max: 13.7 }
  // When
  const result = normalizeChartConstRange(range, 'number')
  // Then
  assert.deepEqual(result, { min: 13.7, max: 14.2 })
})

test('レベル範囲の適用は低レベルと最高レベルの端点も維持する', () => {
  // Given, When & Then: 低レベルは小数9まで含み、最高レベルは定数上限で止まる。
  assert.deepEqual(normalizeChartConstRange({ min: 6, max: 5.9 }, 'level'), { min: 5, max: 6.9 })
  assert.deepEqual(normalizeChartConstRange({ min: 1, max: 16 }, 'level'), { min: 1, max: 16 })
})

test('レベル境界と一致する譜面定数範囲をレベル範囲として判定する', () => {
  // Given / When / Then
  assert.equal(isChartLevelFilterRange({ min: 14, max: 14.9 }), true)
  assert.equal(isChartLevelFilterRange({ min: 13.5, max: 14.4 }), true)
  assert.equal(isChartLevelFilterRange({ min: 1, max: 16 }), true)
  assert.equal(isChartLevelFilterRange({ min: 6, max: 6.9 }), true)
})

test('レベル境界と一致しない譜面定数範囲はレベル範囲として判定しない', () => {
  // Given / When / Then
  assert.equal(isChartLevelFilterRange({ min: 13.7, max: 14.9 }), false)
  assert.equal(isChartLevelFilterRange({ min: 14, max: 14.2 }), false)
  // 6以下は「6 = 6.0〜6.9」にまとめるため、6.5は下端にならない
  assert.equal(isChartLevelFilterRange({ min: 6.5, max: 6.9 }), false)
})

test('全範囲の定数範囲は未変更と判定すること', () => {
  // Given
  const range = { min: 1, max: 16 }

  // When
  const result = isChartConstRangeModified(range)

  // Then
  assert.equal(result, false)
})

test('下限だけが全範囲と異なる定数範囲は変更ありと判定すること', () => {
  // Given
  const range = { min: 2, max: 16 }

  // When
  const result = isChartConstRangeModified(range)

  // Then
  assert.equal(result, true)
})

test('上限だけが全範囲と異なる定数範囲は変更ありと判定すること', () => {
  // Given
  const range = { min: 1, max: 15 }

  // When
  const result = isChartConstRangeModified(range)

  // Then
  assert.equal(result, true)
})
