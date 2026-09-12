import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内定数をテストごとに再評価して設定API関数群を読み込む。
 * @returns 設定APIモジュール。
 */
const loadSettingsApi = () =>
  loadTestModule((cacheKey) => import(`./settings.ts?cache=${cacheKey}`), { authenticate: true })

test('APIトークン一覧は認証付きGETでtokensレスポンスを返す', async () => {
  // Given: APIトークン一覧の呼び出し記録。
  const calls = installFetchRecorder(() => Response.json({ tokens: [] }))

  // When: APIトークン一覧を取得する。
  const { fetchApiTokens } = await loadSettingsApi()
  await fetchApiTokens()

  // Then: 最新仕様の一覧エンドポイントを認証付きで呼び出す。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/auth/api-tokens')
  assert.equal(calls[0]?.init?.method, 'GET')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Authorization'), 'Bearer test-token')
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
  const calls = installFetchRecorder(() => Response.json(responseBody, { status: 201 }))

  // When: 名前付きAPIトークンを発行する。
  const { issueApiToken } = await loadSettingsApi()
  const result = await issueApiToken('Discord Bot')

  // Then: nameをJSONリクエストとして送信し、平文付きレスポンスを返す。
  assert.equal(result.token, 'plain-text-token')
  assert.equal(calls[0]?.init?.method, 'POST')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.equal(calls[0]?.init?.body, JSON.stringify({ name: 'Discord Bot' }))
})

test('APIトークンの名称変更と削除はID指定エンドポイントを使う', async () => {
  // Given: 名称変更レスポンスとAPI呼び出し記録。
  const calls = installFetchRecorder((_input, init) =>
    init?.method === 'PATCH'
      ? Response.json({
          id: 42,
          name: 'CLI',
          token_prefix: 'plain',
          last_used_at: null,
          created_at: '2026-07-22T12:34:56+09:00',
        })
      : new Response(null, { status: 204 })
  )

  // When: ID 42の名称変更と削除を行う。
  const { deleteApiToken, renameApiToken } = await loadSettingsApi()
  await renameApiToken(42, { name: 'CLI' })
  await deleteApiToken(42)

  // Then: PATCHとDELETEの双方でID指定パスを使用する。
  assert.deepEqual(
    calls.map((call) => ({
      url: String(call.input),
      method: call.init?.method,
      body: call.init?.body,
    })),
    [
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
    ]
  )
})

test('データエクスポートはPOSTして添付ファイル名とBlobを返す', async () => {
  // Given: 署名付きJSONとContent-Dispositionヘッダー。
  const exportedJson = '{"signed":true}'
  const calls = installFetchRecorder(
    () =>
      new Response(exportedJson, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="chunisupport-transfer.json"',
        },
      })
  )

  // When: ユーザーデータをエクスポートする。
  const { exportUserDataTransfer } = await loadSettingsApi()
  const result = await exportUserDataTransfer()

  // Then: exportをPOSTし、API指定名とJSON Blobを返す。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/me/data-transfer/export')
  assert.equal(calls[0]?.init?.method, 'POST')
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
  const calls = installFetchRecorder((input) =>
    Response.json(String(input).endsWith('/validate') ? validationResponse : importResponse)
  )

  // When: 移行ファイルを検証してからインポートする。
  const { importUserDataTransfer, validateUserDataTransfer } = await loadSettingsApi()
  await validateUserDataTransfer(file)
  await importUserDataTransfer(file)

  // Then: 両エンドポイントへ同じBlobをapplication/jsonで送信する。
  assert.deepEqual(
    calls.map((call) => ({
      url: String(call.input),
      method: call.init?.method,
      contentType: new Headers(call.init?.headers).get('Content-Type'),
      body: call.init?.body,
    })),
    [
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
    ]
  )
})

test('データ移行の検証はnullの配列フィールドを空配列へ正規化する', async () => {
  // Given: 検証上の問題なしをnullで返すレスポンス。
  const file = new Blob(['{"signed":true}'], { type: 'application/json' })
  installFetchRecorder(() =>
    Response.json({
      importable: true,
      player_name: 'TEST',
      counts: {},
      blockers: null,
      unresolved_references: null,
      unresolved_reference_count: 0,
    })
  )

  // When: 移行ファイルを検証する。
  const { validateUserDataTransfer } = await loadSettingsApi()
  const validation = await validateUserDataTransfer(file)

  // Then: 描画側が常に配列として扱える結果を返す。
  assert.deepEqual(validation.blockers, [])
  assert.deepEqual(validation.unresolved_references, [])
})

test('ユーザー名変更は再認証トークンと新しいユーザー名をPUTする', async () => {
  // Given: 再認証トークン付きのユーザー名変更リクエスト。
  const calls = installFetchRecorder(() => Response.json({ username: 'newname' }))

  // When: 取得済みの再認証トークンでユーザー名を変更する。
  const { updateUsername } = await loadSettingsApi()
  await updateUsername('newname', 'reauth-token')

  // Then: ユーザー名変更エンドポイントへ必要な情報を送信する。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/me/username')
  assert.equal(calls[0]?.init?.method, 'PUT')
  assert.equal(new Headers(calls[0]?.init?.headers).get('X-Reauth-Token'), 'reauth-token')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.equal(calls[0]?.init?.body, JSON.stringify({ username: 'newname' }))
})
