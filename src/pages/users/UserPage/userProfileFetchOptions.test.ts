import assert from 'node:assert/strict'
import test from 'node:test'
import { userProfileFetchOptions } from './userProfileFetchOptions'

test('userProfileFetchOptions は includeNoPlay=true を持つ', () => {
  assert.deepEqual(userProfileFetchOptions, { includeNoPlay: true })
})
