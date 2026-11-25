import assert from 'node:assert/strict'
import test from 'node:test'
import { QueryClient } from '@tanstack/solid-query'
import { setupTestEnvironment } from '../test/setupTestEnvironment'

test('旧ユーザーのコース関連キャッシュを破棄しても公開データや別ユーザーの履歴は残る', async () => {
  // Given: 旧ユーザーのコース一覧・履歴・管理用ランキングと、別ユーザーや公開データのキャッシュがある。
  setupTestEnvironment()
  const { courseQueryKeys: keys } = await import('./courses.ts')
  const queryClient = new QueryClient()
  const removedKeys = [
    keys.list('old_name'),
    keys.history('old_name', 'course'),
    keys.adminRanking('old_name', 'course'),
  ]
  const keptKeys = [
    keys.history('other_name', 'course'),
    keys.adminRanking('other_name', 'course'),
    keys.list(null),
    keys.master(),
    keys.stats('course'),
  ]
  for (const key of [...removedKeys, ...keptKeys]) {
    queryClient.setQueryData(key, { cached: true })
  }

  // When: 認証ライフサイクルで旧ユーザーのキーを削除する。
  queryClient.removeQueries({ queryKey: keys.user('old_name') })

  // Then: 同名ユーザーが後で利用しても旧データを引かず、無関係なキャッシュは維持する。
  for (const key of removedKeys) assert.equal(queryClient.getQueryData(key), undefined)
  for (const key of keptKeys) assert.deepEqual(queryClient.getQueryData(key), { cached: true })
})
