import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_WORLDSEND_FILTER } from '../types/filterDefaults'
import { isWorldsendFilterOptionsChanged } from './filterDialog'

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
