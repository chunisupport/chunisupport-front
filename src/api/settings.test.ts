import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * 設定APIテスト用の環境変数と認証状態を設定する。
 *
 * @returns なし。
 */
const setupSettingsApiTest = async (): Promise<void> => {
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_FRONTEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_DOCUMENTATION_URL = 'https://docs.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_URL = 'https://dist.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_ENTRYPOINT = 'main.js'
  process.env.PUBLIC_FB_API_KEY = 'test-api-key'
  process.env.PUBLIC_FB_AUTH_DOMAIN = 'test.firebaseapp.com'
  process.env.PUBLIC_FB_PROJECT_ID = 'test-project'
  process.env.PUBLIC_FB_STORAGE_BUCKET = 'test.appspot.com'
  process.env.PUBLIC_FB_MESSAGING_SENDER_ID = '123456789'
  process.env.PUBLIC_FB_APP_ID = 'test-app-id'
  process.env.PUBLIC_CF_TURNSTILE_SITE_KEY = '1x00000000000000000000AA'

  const { auth } = await import('../lib/firebase.ts')
  Object.defineProperty(auth, 'authStateReady', {
    configurable: true,
    value: async () => undefined,
  })
  Object.defineProperty(auth, 'currentUser', {
    configurable: true,
    value: { getIdToken: async () => 'test-token' },
  })
}

/**
 * モジュール内定数をテストごとに再評価して設定API関数群を読み込む。
 *
 * @returns 設定APIモジュール。
 */
const loadSettingsApi = async () => {
  await setupSettingsApiTest()
  const cacheKey = `${Date.now()}-${Math.random()}`
  return import(`./settings.ts?cache=${cacheKey}`)
}

test('APIトークン一覧は認証付きGETでtokensレスポンスを返す', async () => {
  // Given: APIトークン一覧レスポンスと呼び出し記録。
  const responseBody = { tokens: [] }
  let request: { url: string; method: string | undefined; authorization: string | null } | undefined
  globalThis.fetch = async (input, init) => {
    request = {
      url: String(input),
      method: init?.method,
      authorization: new Headers(init?.headers).get('Authorization'),
    }
    return Response.json(responseBody)
  }

  // When: APIトークン一覧を取得する。
  const { fetchApiTokens } = await loadSettingsApi()
  const result = await fetchApiTokens()

  // Then: 最新仕様の一覧エンドポイントを認証付きで呼び出す。
  assert.deepEqual(result, responseBody)
  assert.deepEqual(request, {
    url: 'http://localhost:3000/internal/auth/api-tokens',
    method: 'GET',
    authorization: 'Bearer test-token',
  })
})

test('APIトークン発行はnameをJSONでPOSTする', async () => {
  // Given: 発行結果とAPI呼び出し記録。
  const responseBody = {
    id: 42,
    name: 'Discord Bot',
    token: 'plain-text-token',
    token_prefix: 'plain',
    last_used_at: null,
    created_at: '2026-07-22T12:34:56+09:00',
  }
  let request:
    | { method: string | undefined; contentType: string | null; body: BodyInit | null | undefined }
    | undefined
  globalThis.fetch = async (_input, init) => {
    request = {
      method: init?.method,
      contentType: new Headers(init?.headers).get('Content-Type'),
      body: init?.body,
    }
    return Response.json(responseBody, { status: 201 })
  }

  // When: 名前付きAPIトークンを発行する。
  const { issueApiToken } = await loadSettingsApi()
  const result = await issueApiToken('Discord Bot')

  // Then: nameをJSONリクエストとして送信し、平文付きレスポンスを返す。
  assert.deepEqual(result, responseBody)
  assert.deepEqual(request, {
    method: 'POST',
    contentType: 'application/json',
    body: JSON.stringify({ name: 'Discord Bot' }),
  })
})

test('APIトークンの名称変更と削除はID指定エンドポイントを使う', async () => {
  // Given: 名称変更レスポンスとAPI呼び出し記録。
  const renamedToken = {
    id: 42,
    name: 'CLI',
    token_prefix: 'plain',
    last_used_at: null,
    created_at: '2026-07-22T12:34:56+09:00',
  }
  const requests: { url: string; method: string | undefined; body: BodyInit | null | undefined }[] =
    []
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), method: init?.method, body: init?.body })
    return init?.method === 'PATCH'
      ? Response.json(renamedToken)
      : new Response(null, { status: 204 })
  }

  // When: ID 42の名称変更と削除を行う。
  const { deleteApiToken, renameApiToken } = await loadSettingsApi()
  const result = await renameApiToken(42, { name: 'CLI' })
  await deleteApiToken(42)

  // Then: PATCHとDELETEの双方でID指定パスを使用する。
  assert.deepEqual(result, renamedToken)
  assert.deepEqual(requests, [
    {
      url: 'http://localhost:3000/internal/auth/api-tokens/42',
      method: 'PATCH',
      body: JSON.stringify({ name: 'CLI' }),
    },
    {
      url: 'http://localhost:3000/internal/auth/api-tokens/42',
      method: 'DELETE',
      body: undefined,
    },
  ])
})

test('データエクスポートはPOSTして添付ファイル名とBlobを返す', async () => {
  // Given: 署名付きJSONとContent-Dispositionヘッダー。
  const exportedJson = '{"signed":true}'
  let request: { url: string; method: string | undefined } | undefined
  globalThis.fetch = async (input, init) => {
    request = { url: String(input), method: init?.method }
    return new Response(exportedJson, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="chunisupport-transfer.json"',
      },
    })
  }

  // When: ユーザーデータをエクスポートする。
  const { exportUserDataTransfer } = await loadSettingsApi()
  const result = await exportUserDataTransfer()

  // Then: exportをPOSTし、API指定名とJSON Blobを返す。
  assert.deepEqual(request, {
    url: 'http://localhost:3000/internal/me/data-transfer/export',
    method: 'POST',
  })
  assert.equal(result.filename, 'chunisupport-transfer.json')
  assert.equal(await result.blob.text(), exportedJson)
})

test('データ移行の検証と確定は同じJSON BlobをPOSTする', async () => {
  // Given: 移行JSON Blobと検証・確定レスポンス。
  const file = new Blob(['{"signed":true}'], { type: 'application/json' })
  const validationResponse = {
    importable: true,
    player_name: 'テスト',
    counts: {
      records: 1,
      record_histories: 2,
      worldsend_records: 3,
      worldsend_record_histories: 4,
      metric_histories: 5,
      course_records: 6,
      honors: 7,
      favorite_songs: 8,
      locked_songs: 9,
      goal_groups: 10,
      goals: 11,
      record_filters: 12,
    },
    blockers: [],
    unresolved_references: [],
    unresolved_reference_count: 0,
  }
  const importResponse = {
    player_id: 42,
    counts: validationResponse.counts,
  }
  const requests: {
    url: string
    method: string | undefined
    contentType: string | null
    body: BodyInit | null | undefined
  }[] = []
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      method: init?.method,
      contentType: new Headers(init?.headers).get('Content-Type'),
      body: init?.body,
    })
    return Response.json(String(input).endsWith('/validate') ? validationResponse : importResponse)
  }

  // When: 移行ファイルを検証してからインポートする。
  const { importUserDataTransfer, validateUserDataTransfer } = await loadSettingsApi()
  const validation = await validateUserDataTransfer(file)
  const imported = await importUserDataTransfer(file)

  // Then: 両エンドポイントへ同じBlobをapplication/jsonで送信する。
  assert.deepEqual(validation, validationResponse)
  assert.deepEqual(imported, importResponse)
  assert.deepEqual(requests, [
    {
      url: 'http://localhost:3000/internal/me/data-transfer/validate',
      method: 'POST',
      contentType: 'application/json',
      body: file,
    },
    {
      url: 'http://localhost:3000/internal/me/data-transfer/import',
      method: 'POST',
      contentType: 'application/json',
      body: file,
    },
  ])
})

test('データ移行の検証はnullの配列フィールドを空配列へ正規化する', async () => {
  // Given: 検証上の問題なしをnullで返すレスポンス。
  const file = new Blob(['{"signed":true}'], { type: 'application/json' })
  globalThis.fetch = async () =>
    Response.json({
      importable: true,
      player_name: 'TEST',
      counts: {},
      blockers: null,
      unresolved_references: null,
      unresolved_reference_count: 0,
    })

  // When: 移行ファイルを検証する。
  const { validateUserDataTransfer } = await loadSettingsApi()
  const validation = await validateUserDataTransfer(file)

  // Then: 描画側が常に配列として扱える結果を返す。
  assert.deepEqual(validation.blockers, [])
  assert.deepEqual(validation.unresolved_references, [])
})

test('ユーザー名変更は再認証トークンと新しいユーザー名をPUTする', async () => {
  // Given: ユーザー名変更レスポンスと再認証トークン。
  const responseBody = { username: 'newname' }
  let request:
    | {
        url: string
        method: string | undefined
        reauthToken: string | null
        contentType: string | null
        body: BodyInit | null | undefined
      }
    | undefined
  globalThis.fetch = async (input, init) => {
    request = {
      url: String(input),
      method: init?.method,
      reauthToken: new Headers(init?.headers).get('X-Reauth-Token'),
      contentType: new Headers(init?.headers).get('Content-Type'),
      body: init?.body,
    }
    return Response.json(responseBody)
  }

  // When: 取得済みの再認証トークンでユーザー名を変更する。
  const { updateUsername } = await loadSettingsApi()
  const result = await updateUsername('newname', 'reauth-token')

  // Then: ユーザー名変更エンドポイントへ必要な情報を送信する。
  assert.deepEqual(result, responseBody)
  assert.deepEqual(request, {
    url: 'http://localhost:3000/internal/me/username',
    method: 'PUT',
    reauthToken: 'reauth-token',
    contentType: 'application/json',
    body: JSON.stringify({ username: 'newname' }),
  })
})
