import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { appQueryClient } from '../lib/queryClient'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

beforeEach(() => appQueryClient.clear())

/**
 * テスト用環境を準備してポゼッションqueryを読み込む。
 *
 * @returns ポゼッションqueryモジュール。
 */
const loadPossessionsApi = () =>
  loadTestModule((cacheKey) => import(`./possessions.ts?cache=${cacheKey}`))

test('fetchPossessions はマスターデータからポゼッション一覧だけを返す', async () => {
  // Given: ポゼッションを含むマスターデータ。
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

  // When: ポゼッションマスタだけを取得する。
  const { fetchPossessions } = await loadPossessionsApi()
  const possessions = await fetchPossessions()

  // Then: ポゼッションの解決に使える一覧になる。
  assert.equal(possessions.length, 2)
  assert.equal(possessions[0]?.name, 'normal')
  assert.equal(possessions[1]?.name, 'rainbow')
})
