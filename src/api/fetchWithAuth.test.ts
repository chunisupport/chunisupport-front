import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * テスト用のFirebase環境変数を設定して、判定関数を遅延読み込みする。
 *
 * @returns セッションクリア判定関数。
 */
const loadShouldClearSessionOnUnauthorized = async () => {
  process.env.PUBLIC_FB_API_KEY = 'test-api-key'
  process.env.PUBLIC_FB_AUTH_DOMAIN = 'test.firebaseapp.com'
  process.env.PUBLIC_FB_PROJECT_ID = 'test-project'
  process.env.PUBLIC_FB_STORAGE_BUCKET = 'test.appspot.com'
  process.env.PUBLIC_FB_MESSAGING_SENDER_ID = '123456789'
  process.env.PUBLIC_FB_APP_ID = 'test-app-id'

  const { shouldClearSessionOnUnauthorized } = await import('./fetchWithAuth.ts')
  return shouldClearSessionOnUnauthorized
}

test('recent_sign_in_required は抑止対象ならセッションクリアしない', async () => {
  const shouldClearSessionOnUnauthorized = await loadShouldClearSessionOnUnauthorized()
  const result = shouldClearSessionOnUnauthorized(
    401,
    { error: { status: 401, code: 'recent_sign_in_required' } },
    {
      suppressUnauthorizedRedirectForCodes: ['recent_sign_in_required'],
    }
  )

  assert.equal(result, false)
})

test('invalid_token は抑止対象外ならセッションクリアする', async () => {
  const shouldClearSessionOnUnauthorized = await loadShouldClearSessionOnUnauthorized()
  const result = shouldClearSessionOnUnauthorized(
    401,
    { error: { status: 401, code: 'invalid_token' } },
    {
      suppressUnauthorizedRedirectForCodes: ['recent_sign_in_required'],
    }
  )

  assert.equal(result, true)
})
