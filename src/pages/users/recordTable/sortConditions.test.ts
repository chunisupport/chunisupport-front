import assert from 'node:assert/strict'
import test from 'node:test'
import { compareUnplayedRecords } from './sortComparators.ts'
import {
  createInitialSortConditions,
  nextPrimarySortCondition,
  normalizeSortConditions,
  type SortCondition,
} from './sortConditions.ts'
import { sortRecordsWithConditions } from './sortRecords.ts'

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

test('sortRecordsWithConditions は複数条件で安定ソートする', () => {
  // Given
  const records = [
    { id: 'b', score: 100, title: 'Beta' },
    { id: 'a', score: 100, title: 'Alpha' },
    { id: 'c', score: 90, title: 'Charlie' },
  ]
  const sortConditions: SortCondition<TestSortKey>[] = [
    { key: 'score', direction: 'desc' },
    { key: 'title', direction: 'asc' },
  ]

  // When
  const result = sortRecordsWithConditions(
    records,
    sortConditions,
    (record, index) => ({ record, index }),
    (leftEntry, rightEntry, sortCondition) => {
      const direction = sortCondition.direction === 'asc' ? 1 : -1
      switch (sortCondition.key) {
        case 'score':
          return (leftEntry.record.score - rightEntry.record.score) * direction
        case 'title':
          return leftEntry.record.title.localeCompare(rightEntry.record.title, 'ja') * direction
        case 'level':
          return 0
      }
    }
  ).map((record) => record.id)

  // Then
  assert.deepEqual(result, ['a', 'b', 'c'])
})

test('compareUnplayedRecords は未プレイを常に末尾へ寄せる', () => {
  // Given
  const played = true
  const unplayed = false

  // When & Then
  assert.equal(compareUnplayedRecords(played, unplayed), -1)
  assert.equal(compareUnplayedRecords(unplayed, played), 1)
  assert.equal(compareUnplayedRecords(unplayed, unplayed), 0)
  assert.equal(compareUnplayedRecords(played, played), null)
})
