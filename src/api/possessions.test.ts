import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内キャッシュをテストごとに分離して所持状況APIを読み込む。
 *
 * @returns 所持状況APIモジュール。
 */
const loadPossessionsApi = () =>
  loadTestModule((cacheKey) => import(`./possessions.ts?cache=${cacheKey}`))

test('fetchPossessions はマスターデータから所持状況一覧だけを返す', async () => {
  // Given: 所持状況を含むマスターデータ。
  installFetchRecorder(() =>
    Response.json({
      genres: [],
      difficulties: [],
      versions: [],
      account_types: [],
      rating_bands: [],
      achievement_types: [],
      possessions: [
        { id: 1, name: 'normal' },
        { id: 5, name: 'rainbow' },
      ],
    })
  )

  // When: 所持状況マスタだけを取得する。
  const { fetchPossessions } = await loadPossessionsApi()
  const possessions = await fetchPossessions()

  // Then: プレイヤー所持状況の解決に使える一覧になる。
  assert.equal(possessions.length, 2)
  assert.equal(possessions[0]?.name, 'normal')
  assert.equal(possessions[1]?.name, 'rainbow')
})
