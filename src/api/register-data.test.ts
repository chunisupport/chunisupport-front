import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'
import type { PlayerLatestUpdateResult } from '../types/api'

/**
 * モジュール内定数をテストごとに再評価して登録API関数群を読み込む。
 * @returns 登録APIモジュール。
 */
const loadRegisterDataApi = () =>
  loadTestModule((cacheKey) => import(`./register-data.ts?cache=${cacheKey}`), {
    authenticate: true,
  })

test('更新履歴APIは認証付きで複数世代を取得する', async () => {
  // Given: 新しい順の保存済み更新結果。
  const calls = installFetchRecorder(() =>
    Response.json([
      { schema_version: 3, imported_at: '2026-09-24T00:00:00Z' },
      { schema_version: 1, imported_at: '2026-09-23T00:00:00Z' },
    ])
  )

  // When: 更新履歴を取得する。
  const { fetchRecentPlayerDataUpdates } = await loadRegisterDataApi()
  const results = await fetchRecentPlayerDataUpdates()

  // Then: 本人用APIから順序を保った結果を返す。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/me/player-data/updates')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Authorization'), 'Bearer test-token')
  assert.deepEqual(
    results.map((result: PlayerLatestUpdateResult) => result.schema_version),
    [3, 1]
  )
})

test('更新履歴APIは未対応の保存形式を拒否する', async () => {
  // Given: 未対応の形式を含む履歴。
  installFetchRecorder(() => Response.json([{ schema_version: 4 }]))

  // When: 更新履歴を取得する。
  const { fetchRecentPlayerDataUpdates } = await loadRegisterDataApi()

  // Then: 画面に渡す前にエラーを返す。
  await assert.rejects(fetchRecentPlayerDataUpdates, /保存済み更新結果の形式に対応していません。/)
})

test('登録データ送信はjson形式でクエリとJSONヘッダーを付ける', async () => {
  // Given: JSON形式の登録データとAPI呼び出し記録。
  const calls = installFetchRecorder(() => new Response(null, { status: 200 }))

  // When: JSON形式で登録データを送信する。
  const { postRegisterData } = await loadRegisterDataApi()
  await postRegisterData({ data: '{"records":[]}', format: 'json' })

  // Then: json用クエリとJSONヘッダーで送信する。
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/me/register-data?format=json'
  )
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.equal(calls[0]?.init?.body, '{"records":[]}')
})

test('登録データ送信はtext形式でクエリなしとテキストヘッダーを使う', async () => {
  // Given: テキスト形式の登録データとAPI呼び出し記録。
  const calls = installFetchRecorder(() => new Response(null, { status: 200 }))

  // When: テキスト形式で登録データを送信する。
  const { postRegisterData } = await loadRegisterDataApi()
  await postRegisterData({ data: 'raw-data', format: 'text' })

  // Then: クエリなしでテキストヘッダーを使って送信する。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/me/register-data')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'text/plain')
  assert.equal(calls[0]?.init?.body, 'raw-data')
})
