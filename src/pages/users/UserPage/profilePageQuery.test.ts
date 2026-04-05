import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_PROFILE_PAGE_QUERY,
  isRecordPageQuery,
  resolveProfilePageQuery,
} from './profilePageQuery.ts'

test('page クエリ未指定時は rating_best を返す', () => {
  assert.equal(resolveProfilePageQuery(undefined), DEFAULT_PROFILE_PAGE_QUERY)
})

test('page クエリが不正値のときは rating_best を返す', () => {
  assert.equal(resolveProfilePageQuery('invalid'), DEFAULT_PROFILE_PAGE_QUERY)
})

test('page クエリが許可値ならそのまま返す', () => {
  assert.equal(resolveProfilePageQuery('rating_new'), 'rating_new')
  assert.equal(resolveProfilePageQuery('record_normal'), 'record_normal')
  assert.equal(resolveProfilePageQuery('record_we'), 'record_we')
})

test('record 系クエリかどうかを判定できる', () => {
  assert.equal(isRecordPageQuery('record_normal'), true)
  assert.equal(isRecordPageQuery('record_we'), true)
  assert.equal(isRecordPageQuery('rating_best'), false)
  assert.equal(isRecordPageQuery(undefined), false)
})
