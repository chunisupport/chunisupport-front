import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_WORLDSEND_FILTER } from '../types/filterDefaults'
import {
  formatWorldsendLevelStar,
  hasWorldsendJusticeCountFilter,
  isWorldsendFilterOptionsChanged,
} from './filterDialog'

test('isWorldsendFilterOptionsChanged はタイトル検索だけの変更を対象外にすること', () => {
  // Given
  const defaultFilter = { ...DEFAULT_WORLDSEND_FILTER }
  const currentFilter = { ...DEFAULT_WORLDSEND_FILTER, title: 'テスト' }

  // When
  const result = isWorldsendFilterOptionsChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, false)
})

test('isWorldsendFilterOptionsChanged はタイトル検索以外の変更を検出すること', () => {
  // Given
  const defaultFilter = { ...DEFAULT_WORLDSEND_FILTER }
  const currentFilter = {
    ...DEFAULT_WORLDSEND_FILTER,
    levelStarRange: {
      ...DEFAULT_WORLDSEND_FILTER.levelStarRange,
      min: DEFAULT_WORLDSEND_FILTER.levelStarRange.min + 1,
    },
  }

  // When
  const result = isWorldsendFilterOptionsChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

test('formatWorldsendLevelStar は未設定を不明と表示すること', () => {
  // Given: 星数未設定の値。
  const levelStar = null

  // When: ★レベル表示を取得する。
  const result = formatWorldsendLevelStar(levelStar)

  // Then: 不明と表示する。
  assert.equal(result, '不明')
})

test('formatWorldsendLevelStar は星数を★付きで表示すること', () => {
  // Given: 星数3。
  const levelStar = 3

  // When: ★レベル表示を取得する。
  const result = formatWorldsendLevelStar(levelStar)

  // Then: ★付きで表示する。
  assert.equal(result, '★3')
})

test('hasWorldsendJusticeCountFilter は上下限とも未指定なら無効と判定すること', () => {
  // Given: JUSTICE数の上下限とも未指定のフィルター。
  const filter = { ...DEFAULT_WORLDSEND_FILTER, justiceCount: { min: null, max: null } }

  // When: JUSTICE数フィルターの有効性を判定する。
  const result = hasWorldsendJusticeCountFilter(filter)

  // Then: 無効と判定する。
  assert.equal(result, false)
})

test('hasWorldsendJusticeCountFilter は下限だけ指定でも有効と判定すること', () => {
  // Given: 下限だけを指定したフィルター。
  const filter = { ...DEFAULT_WORLDSEND_FILTER, justiceCount: { min: 1, max: null } }

  // When: JUSTICE数フィルターの有効性を判定する。
  const result = hasWorldsendJusticeCountFilter(filter)

  // Then: 有効と判定する。
  assert.equal(result, true)
})

test('hasWorldsendJusticeCountFilter は上限だけ指定でも有効と判定すること', () => {
  // Given: 上限だけを指定したフィルター。
  const filter = { ...DEFAULT_WORLDSEND_FILTER, justiceCount: { min: null, max: 3 } }

  // When: JUSTICE数フィルターの有効性を判定する。
  const result = hasWorldsendJusticeCountFilter(filter)

  // Then: 有効と判定する。
  assert.equal(result, true)
})
