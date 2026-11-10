import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_FILTER } from '../utils/recordFilterDefaults'
import {
  consumeStandardRecordFilter,
  pendingStandardRecordFilter,
  publishStandardRecordFilter,
} from './standardRecordNavigation'

test('最新の通常レコードフィルターだけを適用済みとして破棄する', () => {
  // Given
  const first = publishStandardRecordFilter('first-user', DEFAULT_FILTER)
  const latest = publishStandardRecordFilter('latest-user', {
    ...DEFAULT_FILTER,
    genres: ['POPS & ANIME'],
  })

  // When
  consumeStandardRecordFilter(first)

  // Then
  assert.equal(pendingStandardRecordFilter(), latest)

  // When
  consumeStandardRecordFilter(latest)

  // Then
  assert.equal(pendingStandardRecordFilter(), null)
})
