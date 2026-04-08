import assert from 'node:assert/strict'
import test from 'node:test'

import {
  clearAuthenticatedUser,
  getAuthStatus,
  resetAuthSession,
  setAuthenticatedUser,
} from '../../stores/authSession.ts'
import type { UserDTO } from '../../types/api.ts'
import { resolveAuthSession } from './resolveAuthSession.ts'

const createUser = (): UserDTO => ({
  username: 'alice',
  account_type: 'PLAYER',
  is_private: false,
  last_score_update: null,
})

test('認証済みキャッシュがあればAPIを呼ばず authenticated を返す', async () => {
  let called = false
  setAuthenticatedUser(createUser())

  const result = await resolveAuthSession(async () => {
    called = true
    return createUser()
  })

  assert.equal(result, 'authenticated')
  assert.equal(called, false)
})

test('未確定状態では me API 成功時に authenticated へ更新する', async () => {
  resetAuthSession()
  const user = createUser()

  const result = await resolveAuthSession(async () => user, { forceRefresh: true })

  assert.equal(result, 'authenticated')
  assert.equal(getAuthStatus(), 'authenticated')
})

test('me API 失敗時は unauthenticated へ更新する', async () => {
  setAuthenticatedUser(createUser())

  const result = await resolveAuthSession(
    async () => {
      throw new Error('unauthorized')
    },
    { forceRefresh: true }
  )

  assert.equal(result, 'unauthenticated')
  assert.equal(getAuthStatus(), 'unauthenticated')
})

test('同時実行時は in-flight な認証確認を共有する', async () => {
  clearAuthenticatedUser()
  let callCount = 0
  const user = createUser()

  const fetchCurrentUser = async () => {
    callCount += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return user
  }

  resetAuthSession()

  const [first, second] = await Promise.all([
    resolveAuthSession(fetchCurrentUser, { forceRefresh: true }),
    resolveAuthSession(fetchCurrentUser),
  ])

  assert.equal(first, 'authenticated')
  assert.equal(second, 'authenticated')
  assert.equal(callCount, 1)
})
