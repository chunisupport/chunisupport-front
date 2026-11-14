import assert from 'node:assert/strict'
import test from 'node:test'
import type { SortCondition } from '../../../utils/sortConditions.ts'
import { compareNumberWithUnplayedLast } from './sortComparators.ts'
import { sortRecordsWithConditions } from './sortRecords.ts'

type TestSortKey = 'score' | 'level' | 'title'

test('sortRecordsWithConditions は複数条件で安定ソートする', () => {
  // Given
  const records = [
    { id: 'b', score: 100, title: 'Beta' },
    { id: 'z', score: 100, title: 'Alpha' },
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
  assert.deepEqual(result, ['z', 'a', 'b', 'c'])
})

test('compareNumberWithUnplayedLast は方向に関係なく未プレイを末尾として比較する', () => {
  // Given
  const playedZero = { isPlayed: true, value: 0 }
  const unplayed = { isPlayed: false, value: 0 }

  // When & Then
  assert.equal(compareNumberWithUnplayedLast(unplayed, playedZero, 1), 1)
  assert.equal(compareNumberWithUnplayedLast(playedZero, unplayed, 1), -1)
  assert.equal(compareNumberWithUnplayedLast(unplayed, playedZero, -1), 1)
  assert.equal(compareNumberWithUnplayedLast(playedZero, unplayed, -1), -1)
  assert.equal(compareNumberWithUnplayedLast(unplayed, unplayed, 1), 0)
})

for (const { name, left, right, direction, sign } of [
  { name: '昇順で小さい値を前にする', left: 10, right: 20, direction: 1, sign: -1 },
  { name: '降順で小さい値を後にする', left: 10, right: 20, direction: -1, sign: 1 },
  { name: '昇順で大きい値を後にする', left: 20, right: 10, direction: 1, sign: 1 },
  { name: '降順で大きい値を前にする', left: 20, right: 10, direction: -1, sign: -1 },
  { name: '昇順で同じ値を同順とする', left: 10, right: 10, direction: 1, sign: 0 },
  { name: '降順で同じ値を同順とする', left: 10, right: 10, direction: -1, sign: 0 },
] as const) {
  test(`プレイ済み同士の数値比較は${name}`, () => {
    // Given
    const leftRecord = { isPlayed: true, value: left }
    const rightRecord = { isPlayed: true, value: right }

    // When
    const result = compareNumberWithUnplayedLast(leftRecord, rightRecord, direction)

    // Then: 比較関数の契約である符号だけを確認する (+ 0 で -0 を 0 にそろえる)。
    assert.equal(Math.sign(result) + 0, sign)
  })
}
