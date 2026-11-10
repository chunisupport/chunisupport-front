import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { appQueryClient } from '../lib/queryClient'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

beforeEach(() => appQueryClient.clear())

/**
 * テスト用環境を準備して楽曲名順フォルダqueryを読み込む。
 *
 * @returns 楽曲名順フォルダqueryモジュール。
 */
const loadNameFoldersApi = () =>
  loadTestModule((cacheKey) => import(`./nameFolders.ts?cache=${cacheKey}`))

test('fetchNameFolders はマスターデータから楽曲名順フォルダ一覧を表示順で返す', async () => {
  // Given: 表示順が前後した楽曲名順フォルダを含むマスターデータ。
  installFetchRecorder(() =>
    Response.json({
      genres: [],
      difficulties: [],
      versions: [],
      account_types: [],
      rating_bands: [],
      achievement_types: [],
      possessions: [],
      name_folders: [
        { code: 'KA', name: 'か', sort_order: 2 },
        { code: 'A', name: 'あ', sort_order: 1 },
      ],
    })
  )

  // When: 楽曲名順フォルダマスタだけを取得する。
  const { fetchNameFolders } = await loadNameFoldersApi()
  const nameFolders = await fetchNameFolders()

  // Then: sort_order 昇順の一覧になる。
  assert.deepEqual(
    nameFolders.map((nameFolder: { code: string }) => nameFolder.code),
    ['A', 'KA']
  )
})
