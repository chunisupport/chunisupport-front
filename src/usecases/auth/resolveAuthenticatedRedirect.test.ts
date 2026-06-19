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

test('プロフィールが存在する認証済みユーザーはユーザーページへ遷移する', async () => {
  const redirectPath = await resolveAuthenticatedRedirect(createUser(), async () => undefined)

  assert.equal(redirectPath, '/users/alice%20name')
})

test('プロフィール未登録の認証済みユーザーは仮登録ページへ遷移する', async () => {
  const redirectPath = await resolveAuthenticatedRedirect(createUser(), async () => {
    const error = new Error('not found') as Error & { code?: string }
    error.code = 'user_not_found'
    throw error
  })

  assert.equal(redirectPath, '/register-score-temp')
})

test('認証済みユーザー情報がなければ遷移先を返さない', async () => {
  const redirectPath = await resolveAuthenticatedRedirect(null, async () => undefined)

  assert.equal(redirectPath, null)
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
