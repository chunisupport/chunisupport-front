import assert from 'node:assert/strict'
import test from 'node:test'

import {
  clearAuthenticatedUser,
  getAuthenticatedUser,
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

test('未確定状態では me API 成功時に authenticated へ更新し取得したユーザーを保存する', async () => {
  // Given: 認証状態が未確定で、me API が別名のユーザーを返す
  resetAuthSession()
  const user: UserDTO = { ...createUser(), username: 'bob' }

  // When: 強制再取得を指定せずに認証状態を解決する
  const result = await resolveAuthSession(async () => user)

  // Then: authenticated になり、取得したユーザーが保存される
  assert.equal(result, 'authenticated')
  assert.equal(getAuthStatus(), 'authenticated')
  assert.deepEqual(getAuthenticatedUser(), user)
})

test('強制再取得では既存ユーザーを me API の取得結果で置き換える', async () => {
  // Given: 既存ユーザーが保存済みで、me API は別のユーザーを返す
  setAuthenticatedUser(createUser())
  const refreshedUser: UserDTO = { ...createUser(), username: 'carol', is_private: true }
  let callCount = 0

  // When: 強制再取得を指定して認証状態を解決する
  const result = await resolveAuthSession(
    async () => {
      callCount += 1
      return refreshedUser
    },
    { forceRefresh: true }
  )

  // Then: API が呼ばれ、保存ユーザーが取得結果に置き換わる
  assert.equal(result, 'authenticated')
  assert.equal(callCount, 1)
  assert.deepEqual(getAuthenticatedUser(), refreshedUser)
})

test('me API から 401 が返った場合は unauthenticated へ更新し認証状態をクリアする', async () => {
  // Given: 認証済みユーザーが保存済み
  setAuthenticatedUser(createUser())

  // When: me API が 401 を返す
  const result = await resolveAuthSession(
    async () => {
      const error = new Error('unauthorized') as Error & { status?: number }
      error.status = 401
      throw error
    },
    { forceRefresh: true }
  )

  // Then: unauthenticated になり、保存済みユーザーも消える
  assert.equal(result, 'unauthenticated')
  assert.equal(getAuthStatus(), 'unauthenticated')
  assert.equal(getAuthenticatedUser(), null)
})

test('通信障害など非認証エラーの場合は error を返しセッション状態をクリアしない', async () => {
  const user = createUser()
  setAuthenticatedUser(user)

  const result = await resolveAuthSession(
    async () => {
      throw new Error('network error')
    },
    { forceRefresh: true }
  )

  assert.equal(result, 'error')
  assert.equal(getAuthStatus(), 'error')
  assert.deepEqual(getAuthenticatedUser(), user)
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

test('me API から 401 以外のステータスが返った場合は error を返し認証情報を保持する', async () => {
  // Given: 認証済みユーザーが保存済み
  const user = createUser()
  setAuthenticatedUser(user)

  // When: me API が 403 を返す
  const result = await resolveAuthSession(
    async () => {
      const error = new Error('forbidden') as Error & { status?: number }
      error.status = 403
      throw error
    },
    { forceRefresh: true }
  )

  // Then: error になり、保存済みユーザーを保持する
  assert.equal(result, 'error')
  assert.equal(getAuthStatus(), 'error')
  assert.deepEqual(getAuthenticatedUser(), user)
})

test('me API から認証エラーコードが返った場合は unauthenticated へ更新する', async () => {
  // Given: 認証済みユーザーが保存済み
  setAuthenticatedUser(createUser())

  // When: me API が invalid_token コードで失敗する
  const result = await resolveAuthSession(
    async () => {
      throw Object.assign(new Error('invalid token'), { code: 'invalid_token' })
    },
    { forceRefresh: true }
  )

  // Then: unauthenticated になり、保存済みユーザーも消える
  assert.equal(result, 'unauthenticated')
  assert.equal(getAuthStatus(), 'unauthenticated')
  assert.equal(getAuthenticatedUser(), null)
})

test('me API から未知のコードが返った場合は error を返し認証情報を保持する', async () => {
  // Given: 認証済みユーザーが保存済み
  const user = createUser()
  setAuthenticatedUser(user)

  // When: me API が未知のコードで失敗する
  const result = await resolveAuthSession(
    async () => {
      throw Object.assign(new Error('unknown'), { code: 'not_auth_error' })
    },
    { forceRefresh: true }
  )

  // Then: error になり、保存済みユーザーを保持する
  assert.equal(result, 'error')
  assert.equal(getAuthStatus(), 'error')
  assert.deepEqual(getAuthenticatedUser(), user)
})

test('解決後は in-flight な認証確認を使い回さず新しく取得し直す', async () => {
  // Given: 強制再取得で認証済みになった後、未確定へ戻した状態
  resetAuthSession()
  await resolveAuthSession(async () => createUser(), { forceRefresh: true })
  resetAuthSession()

  // When: 未確定のまま再び解決する
  let callCount = 0
  const refreshedUser = { ...createUser(), username: 'bob' }
  const result = await resolveAuthSession(async () => {
    callCount += 1
    return refreshedUser
  })

  // Then: 前回の解決を使い回さず、新しく取得する
  assert.equal(result, 'authenticated')
  assert.equal(callCount, 1)
  assert.deepEqual(getAuthenticatedUser(), refreshedUser)
})
