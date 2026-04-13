import assert from 'node:assert/strict'
import test from 'node:test'

import { shouldClearSessionOnUnauthorized } from './fetchWithAuth.ts'

test('recent_sign_in_required は抑止対象ならセッションクリアしない', () => {
  const result = shouldClearSessionOnUnauthorized(
    401,
    { error: { status: 401, code: 'recent_sign_in_required' } },
    {
      suppressUnauthorizedRedirectForCodes: ['recent_sign_in_required'],
    }
  )

  assert.equal(result, false)
})

test('invalid_token は抑止対象外ならセッションクリアする', () => {
  const result = shouldClearSessionOnUnauthorized(
    401,
    { error: { status: 401, code: 'invalid_token' } },
    {
      suppressUnauthorizedRedirectForCodes: ['recent_sign_in_required'],
    }
  )

  assert.equal(result, true)
})
