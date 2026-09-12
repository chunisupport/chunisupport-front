import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内定数をテストごとに再評価して登録API関数群を読み込む。
 * @returns 登録APIモジュール。
 */
const loadRegisterDataApi = () =>
  loadTestModule((cacheKey) => import(`./register-data.ts?cache=${cacheKey}`), {
    authenticate: true,
  })

test('最新更新結果APIは保存済み結果を認証付きで取得する', async () => {
  // Given: 保存済み結果とAPI呼び出し記録。
  const calls = installFetchRecorder(() => Response.json({ schema_version: 1, changes: [] }))

  // When: 最新更新結果を取得する。
  const { fetchLatestPlayerDataUpdate } = await loadRegisterDataApi()
  await fetchLatestPlayerDataUpdate()

  // Then: 本人用エンドポイントへ認証付きでアクセスする。
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/me/player-data/latest-update'
  )
  assert.equal(new Headers(calls[0]?.init?.headers).get('Authorization'), 'Bearer test-token')
})

for (const schemaVersion of [2, 3] as const) {
  test(`最新更新結果APIはschema version ${schemaVersion}を受け入れる`, async () => {
    // Given: 対応済みスキーマバージョンの保存済み結果。
    installFetchRecorder(() => Response.json({ schema_version: schemaVersion, changes: [] }))

    // When: 最新更新結果を取得する。
    const { fetchLatestPlayerDataUpdate } = await loadRegisterDataApi()
    const result = await fetchLatestPlayerDataUpdate()

    // Then: 対応済み形式としてレスポンスを返す。
    assert.equal(result?.schema_version, schemaVersion)
  })
}

test('最新更新結果APIは保存済み結果がない204レスポンスをnullへ変換する', async () => {
  // Given: 保存済み結果がないAPIレスポンス。
  installFetchRecorder(() => new Response(null, { status: 204 }))

  // When: 最新更新結果を取得する。
  const { fetchLatestPlayerDataUpdate } = await loadRegisterDataApi()
  const result = await fetchLatestPlayerDataUpdate()

  // Then: 画面で空状態として扱えるnullを返す。
  assert.equal(result, null)
})

test('最新更新結果APIは未対応のスキーマバージョンを拒否する', async () => {
  // Given: フロントエンドが対応していない形式の保存済み結果。
  installFetchRecorder(() => Response.json({ schema_version: 4 }))

  // When: 最新更新結果を取得する。
  const { fetchLatestPlayerDataUpdate } = await loadRegisterDataApi()

  // Then: 不完全な結果を描画せず、呼び出し側へエラーとして通知する。
  await assert.rejects(fetchLatestPlayerDataUpdate, /保存済み更新結果の形式に対応していません。/)
})
