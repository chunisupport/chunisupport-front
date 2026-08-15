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

test('maintenance_mode応答はセッションを維持して可用性StoreへRetry-Afterを反映する', async () => {
  // Given: アプリ内セッションがあり、APIがメンテナンス専用503を返す
  const { fetchWithAuth } = await loadFetchWithAuthModule()
  const { availability, resetAvailability } = await import('../stores/availability.ts')
  const { clearAuthenticatedUser, getAuthenticatedUser, setAuthenticatedUser } = await import(
    '../stores/authSession.ts'
  )
  resetAvailability()
  setAuthenticatedUser({
    username: 'test-admin',
    account_type: 'ADMIN',
    is_private: false,
    last_score_update: null,
  })
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: {
          status: 503,
          code: 'maintenance_mode',
        },
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '120',
        },
      }
    )

  try {
    // When: 共通APIクライアントがメンテナンス応答を受け取る
    await assert.rejects(
      fetchWithAuth('https://example.com/internal/songs', {
        redirectOnUnauthorized: false,
      }),
      (error: Error & { status?: number; code?: string }) =>
        error.status === 503 && error.code === 'maintenance_mode'
    )

    // Then: 認証情報を消さず、コメント取得前のメンテナンス状態へ切り替える
    assert.equal(getAuthenticatedUser()?.username, 'test-admin')
    assert.equal(availability.state.kind, 'maintenance')
    if (availability.state.kind === 'maintenance') {
      assert.equal(availability.state.comment, '')
      assert.equal(availability.state.updatedAt, null)
      assert.equal(availability.state.retryAfterSeconds, 120)
    }
  } finally {
    globalThis.fetch = originalFetch
    clearAuthenticatedUser()
    resetAvailability()
  }
})
