import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_FILTER } from '../utils/recordFilterDefaults'
import {
  consumeStandardRecordFilter,
  pendingStandardRecordFilter,
  publishStandardRecordFilter,
} from './standardRecordNavigation'

test('公開した通常レコードフィルターは指定ユーザーと条件を保持する', () => {
  // Given: ジャンルを指定した通常レコードフィルター。
  const filter = { ...DEFAULT_FILTER, genres: ['POPS & ANIME'] }

  // When: 遷移先へフィルターを公開する。
  const published = publishStandardRecordFilter('latest-user', filter)

  // Then: 返却値とストアの双方が指定ユーザーと全条件を保持する。
  const expected = { username: 'latest-user', filter: { ...filter, genres: ['POPS & ANIME'] } }
  assert.deepEqual(published, expected)
  assert.deepEqual(pendingStandardRecordFilter(), expected)
  consumeStandardRecordFilter(published)
})

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
