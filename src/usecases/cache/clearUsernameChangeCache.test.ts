import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { QueryClient } from '@tanstack/solid-query'
import { db } from '../../lib/db/cacheDB.ts'
import {
  readFriendRequestNotificationState,
  saveFriendRequestNotificationState,
} from '../../repositories/friendRequestNotificationRepository.ts'
import { saveCachedUserRating } from '../../repositories/userApiCacheRepository.ts'
import {
  readStandardRecordColumnsSetting,
  saveStandardRecordColumnsSetting,
} from '../../repositories/viewSettingsRepository.ts'
import type { UserRatingDTO } from '../../types/api.ts'

/**
 * APIモジュールが要求する環境変数を設定してテスト対象を読み込む。
 *
 * @returns ユーザーネーム変更キャッシュ関数とquery key factory。
 */
const loadUsernameChangeCache = async () => {
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
  const [{ friendshipQueryKeys }, { clearUsernameChangeCache }] = await Promise.all([
    import('../../queries/friends.ts'),
    import('./clearUsernameChangeCache.ts'),
  ])
  return { clearUsernameChangeCache, friendshipQueryKeys }
}

const rating = {
  best: [],
  best_candidate: [],
  new: [],
  new_candidate: [],
  rating: null,
  best_average: null,
  new_average: null,
  meta: { updated_at: null },
} as unknown as UserRatingDTO

/**
 * テスト用QueryClientを生成する。
 *
 * @returns 再試行を無効化したQueryClient。
 */
const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

afterEach(async () => {
  await Promise.all([
    db.cacheMetadata.clear(),
    db.userSongRecords.clear(),
    db.userCourseRecords.clear(),
    db.userApiResponses.clear(),
    db.viewSettings.clear(),
    db.friendRequestNotificationStates.clear(),
  ])
})

test('ユーザーネーム変更後は認証ユーザー用キャッシュを削除し表示設定を保持すること', async () => {
  // Given: ユーザーAPI、通知、表示設定、フレンドqueryを保存する。
  const { clearUsernameChangeCache, friendshipQueryKeys } = await loadUsernameChangeCache()
  await saveCachedUserRating('alice', 'user-1', 'songs-1', rating)
  await saveFriendRequestNotificationState('alice', true, '2026-09-01T00:00:00.000Z')
  await saveFriendRequestNotificationState('bob', false, '2026-09-01T00:05:00.000Z')
  await saveStandardRecordColumnsSetting(['title', 'score'])
  const queryClient = createTestQueryClient()
  const aliceQueryKey = friendshipQueryKeys.friends('alice')
  const bobQueryKey = friendshipQueryKeys.friends('bob')
  queryClient.setQueryData(aliceQueryKey, [])
  queryClient.setQueryData(bobQueryKey, [])

  // When: alice のユーザーネーム変更後キャッシュを削除する。
  await clearUsernameChangeCache(queryClient, 'alice')

  // Then: 認証ユーザー用キャッシュとaliceの状態が消え、表示設定とbobの状態は残る。
  assert.equal(await db.userApiResponses.count(), 0)
  assert.equal(await readFriendRequestNotificationState('alice'), null)
  assert.notEqual(await readFriendRequestNotificationState('bob'), null)
  assert.deepEqual(await readStandardRecordColumnsSetting(), ['title', 'score'])
  assert.equal(queryClient.getQueryState(aliceQueryKey), undefined)
  assert.notEqual(queryClient.getQueryState(bobQueryKey), undefined)
  queryClient.clear()
})

test('キャッシュ削除に失敗してもユーザーネーム変更の成功フローを拒否しないこと', async () => {
  // Given: IndexedDBのユーザーAPIキャッシュ削除だけが失敗する。
  const { clearUsernameChangeCache } = await loadUsernameChangeCache()
  const queryClient = createTestQueryClient()
  const originalClear = db.userApiResponses.clear.bind(db.userApiResponses)
  db.userApiResponses.clear = (() =>
    Promise.reject(new Error('IndexedDB error'))) as typeof db.userApiResponses.clear

  try {
    // When & Then: 補助的な削除失敗は呼び出し元へ伝播しない。
    await assert.doesNotReject(clearUsernameChangeCache(queryClient, 'alice'))
  } finally {
    db.userApiResponses.clear = originalClear
    queryClient.clear()
  }
})
