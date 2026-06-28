import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_WORLDSEND_FILTER } from '../types/filterDefaults.ts'
import type { WorldsendFilterState } from '../types/filterTypes.ts'
import { isWorldsendFilterChanged, isWorldsendFilterOptionsChanged } from './filterDialog.ts'

test('isWorldsendFilterChanged は既定値と同じ条件を未変更として扱うこと', () => {
  // Given
  const defaultFilter = { ...DEFAULT_WORLDSEND_FILTER }
  const currentFilter = { ...DEFAULT_WORLDSEND_FILTER }

  // When
  const result = isWorldsendFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, false)
})

test('isWorldsendFilterChanged はタイトル検索の変更を検出すること', () => {
  // Given
  const defaultFilter = { ...DEFAULT_WORLDSEND_FILTER }
  const currentFilter = { ...DEFAULT_WORLDSEND_FILTER, title: 'テスト' }

  // When
  const result = isWorldsendFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

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

test('isWorldsendFilterChanged は配列の順序だけが違う場合を未変更として扱うこと', () => {
  // Given
  const defaultFilter = {
    ...DEFAULT_WORLDSEND_FILTER,
    attributes: ['割', '止'],
  }
  const currentFilter = {
    ...DEFAULT_WORLDSEND_FILTER,
    attributes: ['止', '割'],
  }

  // When
  const result = isWorldsendFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, false)
})

test('isWorldsendFilterChanged は選択値の差分を検出すること', () => {
  // Given
  const defaultFilter = {
    ...DEFAULT_WORLDSEND_FILTER,
    genres: ['POPS & ANIME', 'niconico'],
  }
  const currentFilter = {
    ...DEFAULT_WORLDSEND_FILTER,
    genres: ['niconico'],
  }

  // When
  const result = isWorldsendFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

test('isWorldsendFilterChanged はレベル範囲の変更を検出すること', () => {
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
  const result = isWorldsendFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})

test('isWorldsendFilterChanged はnullを含むランプ配列の差分を検出すること', () => {
  // Given
  const defaultFilter = {
    ...DEFAULT_WORLDSEND_FILTER,
    hard_lamp: [null, 'CLEAR', 'HARD'],
  } satisfies WorldsendFilterState
  const currentFilter = {
    ...DEFAULT_WORLDSEND_FILTER,
    hard_lamp: ['CLEAR', 'HARD'],
  } satisfies WorldsendFilterState

  // When
  const result = isWorldsendFilterChanged(currentFilter, defaultFilter)

  // Then
  assert.equal(result, true)
})
