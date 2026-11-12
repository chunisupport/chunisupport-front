import assert from 'node:assert/strict'
import test from 'node:test'

import type { UserDTO } from '../../types/api.ts'
import { resolveAuthenticatedRedirect } from './resolveAuthenticatedRedirect.ts'

const createUser = (): UserDTO => ({
  username: 'alice name',
  account_type: 'PLAYER',
  is_private: false,
  last_score_update: null,
})

test('認証済みユーザーの名前でプロフィールを取得し、完了後にユーザーページへ遷移する', async () => {
  // Given: プロフィール取得の完了をテスト側で制御する。
  let resolve!: (value: unknown) => void
  const promise = new Promise<unknown>((resolvePromise) => {
    resolve = resolvePromise
  })
  const requestedUsernames: string[] = []
  let settled = false

  // When
  const redirect = resolveAuthenticatedRedirect(createUser(), (username) => {
    requestedUsernames.push(username)
    return promise
  })
  void redirect.then(() => {
    settled = true
  })
  await new Promise<void>((resolve) => setImmediate(resolve))

  // Then: 正しい名前で取得し、取得待ちの間は遷移先を確定しない。
  assert.deepEqual(requestedUsernames, ['alice name'])
  assert.equal(settled, false)

  // When: プロフィール取得が成功する。
  resolve(undefined)
  const redirectPath = await redirect

  // Then
  assert.equal(redirectPath, '/users/alice%20name')
})

test('プロフィール未登録の認証済みユーザーは取得エラーをそのまま送出する', async () => {
  const expectedError = Object.assign(new Error('not found'), { code: 'user_not_found' })

  await assert.rejects(
    () =>
      resolveAuthenticatedRedirect(createUser(), async () => {
        throw expectedError
      }),
    expectedError
  )
})

test('認証済みユーザー情報がなければプロフィールを取得せず遷移先を返さない', async () => {
  // Given
  const requestedUsernames: string[] = []

  // When
  const redirectPath = await resolveAuthenticatedRedirect(null, async (username) => {
    requestedUsernames.push(username)
  })

  // Then
  assert.equal(redirectPath, null)
  assert.deepEqual(requestedUsernames, [])
})

test('想定外のプロフィール取得失敗はそのまま送出する', async () => {
  const expectedError = new Error('boom')

  await assert.rejects(
    () =>
      resolveAuthenticatedRedirect(createUser(), async () => {
        throw expectedError
      }),
    expectedError
  )
})
