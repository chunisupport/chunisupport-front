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

test('createInitialSortConditions は第1条件だけ指定値で置き換える', () => {
  // Given
  const sortKey = 'level'
  const sortDirection = 'asc'

  // When
  const result = createInitialSortConditions(sortKey, sortDirection, DEFAULT_SORT_CONDITIONS)

  // Then
  assert.deepEqual(result, [
    { key: 'level', direction: 'asc' },
    { key: 'level', direction: 'desc' },
    { key: 'title', direction: 'asc' },
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
