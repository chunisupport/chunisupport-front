import assert from 'node:assert/strict'
import test from 'node:test'
import { createUserProfileFetchOptions } from './userProfileFetchOptions.ts'

test('createUserProfileFetchOptions は includeNoPlay=true を返す', () => {
  assert.deepEqual(createUserProfileFetchOptions(), { includeNoPlay: true })
})
