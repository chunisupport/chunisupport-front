import assert from 'node:assert/strict'
import test from 'node:test'
import type { SortCondition } from '../../../utils/sortConditions.ts'
import { sortRecordsWithConditions } from './sortRecords.ts'

type TestSortKey = 'score' | 'level' | 'title'

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
