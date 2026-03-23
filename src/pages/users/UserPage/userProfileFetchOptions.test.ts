import assert from 'node:assert/strict'
import test from 'node:test'
import { getUserProfileFetchOptions } from './userProfileFetchOptions.ts'

test('レーティング表示用オプションは view=rating かつ includeNoPlay=true を返す', () => {
  assert.deepEqual(getUserProfileFetchOptions('rating'), {
    includeNoPlay: true,
    view: 'rating',
  })
})

test('レコード表示用オプションは view=record かつ includeNoPlay=true を返す', () => {
  assert.deepEqual(getUserProfileFetchOptions('record'), {
    includeNoPlay: true,
    view: 'record',
  })
})

test('view 未指定時も includeNoPlay=true は維持する', () => {
  assert.deepEqual(getUserProfileFetchOptions(), { includeNoPlay: true })
})
