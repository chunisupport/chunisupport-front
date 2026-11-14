import assert from 'node:assert/strict'
import test from 'node:test'
import { loadTestModule } from '../test/setupTestEnvironment'

/**
 * テスト用のFirebase環境変数を設定して、認証付き fetch モジュールを遅延読み込みする。
 * @returns 認証付き fetch モジュール。
 */
const loadFetchWithAuthModule = () => loadTestModule(() => import('./fetchWithAuth.ts'))

test('401応答は通常セッションを消去し、明示した抑止時だけ維持する', async (t) => {
  // Given: 認証済みセッションと、401を返すAPI。
  const { fetchWithAuth } = await loadFetchWithAuthModule()
  const { clearAuthenticatedUser, getAuthenticatedUser, setAuthenticatedUser } = await import(
    '../stores/authSession.ts'
  )
  const user = {
    username: 'alice',
    account_type: 'PLAYER',
    is_private: false,
    last_score_update: null,
  } as const
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: { status: 401, code: 'invalid_token' } }, { status: 401 })
  )
  try {
    for (const options of [
      {},
      { suppressUnauthorizedRedirectForCodes: ['invalid_token'] as const },
      { redirectOnUnauthorized: false },
    ]) {
      setAuthenticatedUser(user)

      // When: 実際の共通APIクライアントで401応答を処理する。
      await assert.rejects(
        fetchWithAuth('https://example.com/internal/me', { idToken: 'test-token', ...options }),
        (error: Error & { status?: number; code?: string }) =>
          error.status === 401 && error.code === 'invalid_token'
      )

      // Then: 判定関数の戻り値だけでなく、保存済みセッションの副作用も確認する。
      const suppressed =
        'suppressUnauthorizedRedirectForCodes' in options || 'redirectOnUnauthorized' in options
      assert.deepEqual(getAuthenticatedUser(), suppressed ? user : null)
    }
  } finally {
    clearAuthenticatedUser()
  }
})

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

test('未ログインでも明示したIDトークンで認証必須APIを呼び出せる', async () => {
  // Given: Firebase にログインしておらず、別アカウントのIDトークンを指定する
  const { fetchWithAuth } = await loadFetchWithAuthModule()
  const originalFetch = globalThis.fetch
  let authorization: string | null = null
  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    authorization = new Headers(init?.headers).get('Authorization')
    return new Response()
  }

  try {
    // When: 認証必須 API を指定トークンで呼び出す
    await fetchWithAuth('https://example.com/internal/me', {
      requireAuthentication: true,
      idToken: 'other-account-token',
    })

    // Then: 指定トークンが Bearer として送られる
    assert.equal(authorization, 'Bearer other-account-token')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('IDトークンを指定した場合はログイン中のセッションではなく指定トークンで認証する', async (t) => {
  // Given: 明示トークンとは異なるトークンを返すログイン済みユーザー
  const { fetchWithAuth } = await loadFetchWithAuthModule()
  const { auth } = await import('../lib/firebase.ts')
  const originalCurrentUser = Object.getOwnPropertyDescriptor(auth, 'currentUser')
  t.mock.method(auth, 'authStateReady', async () => undefined)
  Object.defineProperty(auth, 'currentUser', {
    configurable: true,
    value: { getIdToken: async () => 'session-token' },
  })
  let authorization: string | null = null
  t.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
    authorization = new Headers(init?.headers).get('Authorization')
    return new Response()
  })

  try {
    // When: ログイン中のセッションとは別のトークンを明示する
    await fetchWithAuth('https://example.com/internal/me', {
      requireAuthentication: true,
      idToken: 'other-account-token',
    })

    // Then: セッションではなく明示したトークンで認証する
    assert.equal(authorization, 'Bearer other-account-token')
  } finally {
    if (originalCurrentUser) {
      Object.defineProperty(auth, 'currentUser', originalCurrentUser)
    } else {
      Reflect.deleteProperty(auth, 'currentUser')
    }
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

test('401以外のステータスでエラー情報がない場合はセッションクリアしない', async () => {
  // Given: 認証エラーではない500応答。
  const { shouldClearSessionOnUnauthorized } = await loadFetchWithAuthModule()

  // When: リダイレクト抑止なしでセッションクリア可否を判定する。
  const result = shouldClearSessionOnUnauthorized(500, undefined, {})

  // Then: 未認証を示す情報がないためクリアしない。
  assert.equal(result, false)
})

test('401でエラー情報がない場合もセッションクリアする', async () => {
  // Given: エラー本文のない401応答。
  const { shouldClearSessionOnUnauthorized } = await loadFetchWithAuthModule()

  // When: リダイレクト抑止なしでセッションクリア可否を判定する。
  const result = shouldClearSessionOnUnauthorized(401, undefined, {})

  // Then: ステータスだけで未認証と判断してクリアする。
  assert.equal(result, true)
})

test('401以外でも認証エラーコード付きならセッションクリアする', async () => {
  // Given: ステータスは500だが認証エラーコードを含む応答。
  const { shouldClearSessionOnUnauthorized } = await loadFetchWithAuthModule()

  // When: リダイレクト抑止なしでセッションクリア可否を判定する。
  const result = shouldClearSessionOnUnauthorized(
    500,
    { error: { status: 500, code: 'invalid_token' } },
    {}
  )

  // Then: コードから未認証と判断してクリアする。
  assert.equal(result, true)
})

test('401以外で認証対象外コードならセッションクリアしない', async () => {
  // Given: ステータスもコードも認証エラーではない応答。
  const { shouldClearSessionOnUnauthorized } = await loadFetchWithAuthModule()

  // When: リダイレクト抑止なしでセッションクリア可否を判定する。
  const result = shouldClearSessionOnUnauthorized(
    500,
    { error: { status: 500, code: 'recent_sign_in_required' } },
    {}
  )

  // Then: 未認証を示さないためクリアしない。
  assert.equal(result, false)
})

test('認証必須で未ログインの場合はリダイレクト有効でも未認証エラーになる', async () => {
  // Given: Firebaseにログインしていない状態。
  const { fetchWithAuth } = await loadFetchWithAuthModule()

  // When & Then: ログイン画面へ遷移しようとせず未認証エラーになる。
  await assert.rejects(
    fetchWithAuth('https://example.com/internal/me', {
      requireAuthentication: true,
    }),
    (error: Error & { status?: number; code?: string }) =>
      error.status === 401 && error.code === 'missing_token'
  )
})
