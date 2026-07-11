import assert from 'node:assert/strict'
import test from 'node:test'
import type { SortCondition } from '../../../utils/sortConditions.ts'
import {
  compareNumberWithUnplayedBelowZero,
  compareNumberWithUnplayedLast,
} from './sortComparators.ts'
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

test('compareNumberWithUnplayedBelowZero は未プレイをプレイ済み0より低い側として比較する', () => {
  // Given
  const playedZero = { isPlayed: true, value: 0 }
  const unplayed = { isPlayed: false, value: 0 }

  // When & Then
  assert.equal(compareNumberWithUnplayedBelowZero(unplayed, playedZero), -1)
  assert.equal(compareNumberWithUnplayedBelowZero(playedZero, unplayed), 1)
  assert.equal(compareNumberWithUnplayedBelowZero(unplayed, unplayed), 0)
})

test('compareNumberWithUnplayedBelowZero はプレイ済みの負数より未プレイを低い側として比較する', () => {
  // Given
  const playedNegative = { isPlayed: true, value: -100 }
  const unplayed = { isPlayed: false, value: 0 }

  // When & Then
  assert.equal(compareNumberWithUnplayedBelowZero(unplayed, playedNegative), -1)
  assert.equal(compareNumberWithUnplayedBelowZero(playedNegative, unplayed), 1)
})

test('compareNumberWithUnplayedBelowZero はプレイ済み同士では数値を比較する', () => {
  // Given
  const playedLow = { isPlayed: true, value: 10 }
  const playedHigh = { isPlayed: true, value: 20 }

  // When & Then
  assert.equal(compareNumberWithUnplayedBelowZero(playedLow, playedHigh), -10)
  assert.equal(compareNumberWithUnplayedBelowZero(playedHigh, playedLow), 10)
  assert.equal(compareNumberWithUnplayedBelowZero(playedLow, playedLow), 0)
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

test('compareNumberWithUnplayedLast はプレイ済み同士では方向を反映して数値を比較する', () => {
  // Given
  const playedLow = { isPlayed: true, value: 10 }
  const playedHigh = { isPlayed: true, value: 20 }

  // When & Then
  assert.equal(compareNumberWithUnplayedLast(playedLow, playedHigh, 1), -10)
  assert.equal(compareNumberWithUnplayedLast(playedLow, playedHigh, -1), 10)
  assert.equal(compareNumberWithUnplayedLast(playedHigh, playedLow, 1), 10)
  assert.equal(compareNumberWithUnplayedLast(playedHigh, playedLow, -1), -10)
})
