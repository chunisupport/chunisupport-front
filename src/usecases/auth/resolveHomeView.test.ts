import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveHomeView } from './resolveHomeView.ts'

test('未ログイン時は guest view を返す', () => {
  const result = resolveHomeView({
    authStatus: 'unauthenticated',
    username: null,
  })

  assert.deepEqual(result, { type: 'guest' })
})

test('ログイン済みかつユーザー名がある場合は authenticated view を返す', () => {
  const result = resolveHomeView({
    authStatus: 'authenticated',
    username: 'alice',
  })

  assert.deepEqual(result, { type: 'authenticated', username: 'alice' })
})

test('認証状態が曖昧な場合は loading view を返す', () => {
  const result = resolveHomeView({ authStatus: 'unknown', username: null })

  assert.deepEqual(result, { type: 'loading' })
})
