import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createInitialSortConditions,
  nextPrimarySortCondition,
  normalizeSortConditions,
  type SortCondition,
} from './sortConditions.ts'

type TestSortKey = 'score' | 'level' | 'title'

const DEFAULT_SORT_CONDITIONS: SortCondition<TestSortKey>[] = [
  { key: 'score', direction: 'desc' },
  { key: 'level', direction: 'desc' },
  { key: 'title', direction: 'asc' },
]

test('normalizeSortConditions は不足分を既定条件で補い最後の条件を固定する', () => {
  // Given
  const sortConditions: SortCondition<TestSortKey>[] = [
    { key: 'level', direction: 'asc' },
    { key: 'score', direction: 'asc' },
    { key: 'title', direction: 'desc' },
  ]

  // When
  const result = normalizeSortConditions(sortConditions, DEFAULT_SORT_CONDITIONS)

  // Then
  assert.deepEqual(result, [
    { key: 'level', direction: 'asc' },
    { key: 'score', direction: 'asc' },
    { key: 'title', direction: 'asc' },
  ])
})

test('createInitialSortConditions は第1条件を指定値にし、重複キーを既定条件で補完する', () => {
  // Given
  const sortKey = 'level'
  const sortDirection = 'asc'

  // When
  const result = createInitialSortConditions(sortKey, sortDirection, DEFAULT_SORT_CONDITIONS)

  // Then: 第2条件の level は重複するため、残りの既定条件で補完する。
  assert.deepEqual(result, [
    { key: 'level', direction: 'asc' },
    { key: 'score', direction: 'desc' },
    { key: 'title', direction: 'asc' },
  ])
})

test('createInitialSortConditions は固定条件と同じキーを第1条件に指定しても重複しない', () => {
  // Given: 既定の最終条件と同じ title を第1条件にする。
  const sortKey = 'title'
  const sortDirection = 'desc'

  // When
  const result = createInitialSortConditions(sortKey, sortDirection, DEFAULT_SORT_CONDITIONS)

  // Then: 最終条件は未使用の既定条件で補完し、キーを重複させない。
  assert.deepEqual(result, [
    { key: 'title', direction: 'desc' },
    { key: 'score', direction: 'desc' },
    { key: 'level', direction: 'desc' },
  ])
})

test('nextPrimarySortCondition は同じ列の方向だけを交互に切り替える', () => {
  // Given
  const currentSortCondition: SortCondition<TestSortKey> = { key: 'score', direction: 'asc' }

  // When
  const resultFromSameKey = nextPrimarySortCondition(currentSortCondition, 'score')
  const resultFromOtherKey = nextPrimarySortCondition(currentSortCondition, 'title')

  // Then
  assert.deepEqual(resultFromSameKey, { key: 'score', direction: 'desc' })
  assert.deepEqual(resultFromOtherKey, { key: 'title', direction: 'asc' })
})
