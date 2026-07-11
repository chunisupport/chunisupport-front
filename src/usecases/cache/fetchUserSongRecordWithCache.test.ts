import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { db } from '../../lib/db/cacheDB.ts'
import { clearAuthenticatedUser, setAuthenticatedUser } from '../../stores/authSession.ts'
import type { PlayerRecordDTO, UserDTO } from '../../types/api.ts'

const originalFetch = globalThis.fetch
const API_BASE_URL = 'http://localhost:3000'

const user: UserDTO = {
  username: 'alice',
  account_type: 'PLAYER',
  is_private: false,
  last_score_update: null,
}

const record = {
  id: 'song/1',
  difficulty: 'MASTER',
  is_played: true,
  score: 1_009_500,
} as PlayerRecordDTO

/**
 * APIとFirebaseのテスト用環境変数を設定する。
 *
 * @returns なし。
 */
const setupApiTestEnv = (): void => {
  process.env.PUBLIC_BACKEND_URL = API_BASE_URL
  process.env.PUBLIC_FRONTEND_URL = API_BASE_URL
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
}

/**
 * テストで使用した認証状態、fetch、IndexedDBキャッシュを初期化する。
 *
 * @returns 初期化完了後に解決されるPromise。
 */
const resetTestState = async (): Promise<void> => {
  globalThis.fetch = originalFetch
  clearAuthenticatedUser()
  await Promise.all([
    db.cacheMetadata.clear(),
    db.userSongRecords.clear(),
    db.userApiResponses.clear(),
  ])
}

afterEach(resetTestState)

test('通常楽曲詳細の単曲レコード取得は2回目にIndexedDBキャッシュを使用すること', async () => {
  // Given
  setupApiTestEnv()
  const { fetchUserStandardSongRecordWithCache } = await import('./fetchUserSongRecordWithCache.ts')
  setAuthenticatedUser(user)
  const requestedUrls: string[] = []
  globalThis.fetch = async (input) => {
    const url = String(input)
    requestedUrls.push(url)

    if (url.endsWith('/internal/users/alice/updated-at')) {
      return Response.json({ updated_at: '2026-07-06T00:00:00Z' })
    }
    if (url.endsWith('/internal/songs/updated-at')) {
      return Response.json({ updated_at: '2026-07-06T00:00:00Z' })
    }
    if (url === `${API_BASE_URL}/internal/users/alice/record/songs/song%2F1?include_noplay=true`) {
      return Response.json({
        standard: [record],
        meta: { updated_at: '2026-07-06T00:00:00Z' },
      })
    }

    throw new Error(`unexpected fetch: ${url}`)
  }

  // When
  const first = await fetchUserStandardSongRecordWithCache('alice', 'song/1')
  const second = await fetchUserStandardSongRecordWithCache('alice', 'song/1')

  // Then
  assert.deepEqual(first, [record])
  assert.deepEqual(second, [record])
  assert.equal(requestedUrls.filter((url) => url.includes('/record/songs/song%2F1')).length, 1)
  assert.equal(await db.userSongRecords.count(), 1)
})
