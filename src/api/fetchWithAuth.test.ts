import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * テスト用のFirebase環境変数を設定して、認証付き fetch モジュールを遅延読み込みする。
 *
 * @returns 認証付き fetch モジュール。
 */
const loadFetchWithAuthModule = async () => {
  process.env.PUBLIC_FB_API_KEY = 'test-api-key'
  process.env.PUBLIC_FB_AUTH_DOMAIN = 'test.firebaseapp.com'
  process.env.PUBLIC_FB_PROJECT_ID = 'test-project'
  process.env.PUBLIC_FB_STORAGE_BUCKET = 'test.appspot.com'
  process.env.PUBLIC_FB_MESSAGING_SENDER_ID = '123456789'
  process.env.PUBLIC_FB_APP_ID = 'test-app-id'

  return import('./fetchWithAuth.ts')
}

test('recent_sign_in_required は抑止対象ならセッションクリアしない', async () => {
  const { shouldClearSessionOnUnauthorized } = await loadFetchWithAuthModule()
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
  const { shouldClearSessionOnUnauthorized } = await loadFetchWithAuthModule()
  const result = shouldClearSessionOnUnauthorized(
    401,
    { error: { status: 401, code: 'invalid_token' } },
    {
      suppressUnauthorizedRedirectForCodes: ['recent_sign_in_required'],
    }
  )

  assert.equal(result, true)
})

test('認証必須リクエストはFirebaseユーザー不在時にAPIを呼ばない', async () => {
  // Given: Firebase にログインしておらず、API 呼び出しを監視する
  const { fetchWithAuth } = await loadFetchWithAuthModule()
  const originalFetch = globalThis.fetch
  let fetchCalled = false
  globalThis.fetch = async () => {
    fetchCalled = true
    return new Response()
  }

  try {
    // When & Then: 認証必須 API はローカルで未認証エラーになる
    await assert.rejects(
      fetchWithAuth('https://example.com/internal/me', {
        redirectOnUnauthorized: false,
        requireAuthentication: true,
      }),
      (error: Error & { status?: number; code?: string }) =>
        error.status === 401 && error.code === 'missing_token'
    )
    assert.equal(fetchCalled, false)
  } finally {
    globalThis.fetch = originalFetch
  }
})
