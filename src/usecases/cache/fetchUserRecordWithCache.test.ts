import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { db } from '../../lib/db/cacheDB.ts'
import { appQueryClient } from '../../lib/queryClient'
import { clearAuthenticatedUser, setAuthenticatedUser } from '../../stores/authSession.ts'
import type { PlayerRecordDTO, UserDTO, UserRecordDTO } from '../../types/api.ts'

beforeEach(() => appQueryClient.clear())

const originalFetch = globalThis.fetch
const API_BASE_URL = 'http://localhost:3000'

const user: UserDTO = {
  username: 'alice',
  account_type: 'PLAYER',
  is_private: false,
  last_score_update: null,
}

const recordResponse = {
  standard: [{ id: 'song/1', difficulty: 'MASTER', is_played: true, score: 1_009_500 }],
  worldsend: [],
  meta: { updated_at: '2026-07-06T00:00:00Z' },
} as unknown as UserRecordDTO & { standard: PlayerRecordDTO[] }

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
 * 全件レコードAPIと更新日時APIを返すfetchを差し替え、レコードAPIの呼び出し回数を数える。
 *
 * @param options - 更新日時APIを失敗させるかどうか。
 * @returns ユーザー名ごとのレコードAPI呼び出し回数。
 */
const mockRecordFetch = (options: { failUpdatedAt?: boolean } = {}): Map<string, number> => {
  const recordFetchCounts = new Map<string, number>()
  globalThis.fetch = async (input) => {
    const url = String(input)
    const recordMatch = url.match(/\/internal\/users\/([^/]+)\/record$/)
    if (recordMatch) {
      recordFetchCounts.set(recordMatch[1], (recordFetchCounts.get(recordMatch[1]) ?? 0) + 1)
      return Response.json(recordResponse)
    }
    if (url.endsWith('/updated-at') && options.failUpdatedAt) {
      return Response.json({ error: { code: 'internal_error' } }, { status: 500 })
    }
    // 本人判定が壊れた場合に他人のキャッシュも作れてしまうよう、どのユーザーにも返す。
    if (/\/internal\/users\/[^/]+\/updated-at$/.test(url)) {
      return Response.json({ updated_at: '2026-07-06T00:00:00Z', stats_revision: 1 })
    }
    if (url.endsWith('/internal/songs/updated-at')) {
      return Response.json({ updated_at: '2026-07-06T00:00:00Z', revision: 1 })
    }

    throw new Error(`unexpected fetch: ${url}`)
  }
  return recordFetchCounts
}

afterEach(async () => {
  globalThis.fetch = originalFetch
  clearAuthenticatedUser()
  await Promise.all([
    db.cacheMetadata.clear(),
    db.userSongRecords.clear(),
    db.userApiResponses.clear(),
  ])
})

test('本人の全件レコード取得は2回目にIndexedDBキャッシュを使用すること', async () => {
  // Given: ログイン中の本人として全件レコードを取得する。
  setupApiTestEnv()
  const { fetchUserRecordWithCache } = await import('./fetchUserRecordWithCache.ts')
  setAuthenticatedUser(user)
  const recordFetchCounts = mockRecordFetch()

  // When
  const first = await fetchUserRecordWithCache('alice')
  const second = await fetchUserRecordWithCache('alice')

  // Then: レコードAPIは1回だけ呼ばれ、2回目は同じ内容をキャッシュから返す。
  assert.deepEqual(first.standard, recordResponse.standard)
  assert.deepEqual(second.standard, recordResponse.standard)
  assert.equal(recordFetchCounts.get('alice'), 1)
})

test('他人の全件レコード取得はIndexedDBキャッシュを読み書きしないこと', async () => {
  // Given: alice でログイン中に bob のレコードを表示する。
  setupApiTestEnv()
  const { fetchUserRecordWithCache } = await import('./fetchUserRecordWithCache.ts')
  setAuthenticatedUser(user)
  const recordFetchCounts = mockRecordFetch()

  // When
  await fetchUserRecordWithCache('bob')
  await fetchUserRecordWithCache('bob')

  // Then: 毎回APIから取得し、端末内には何も保存しない。
  assert.equal(recordFetchCounts.get('bob'), 2)
  assert.equal(await db.userSongRecords.count(), 0)
  assert.equal(await db.cacheMetadata.count(), 0)
})

test('更新日時を取得できない場合はキャッシュを使わずAPIから取得すること', async () => {
  // Given: 本人だが更新日時APIが失敗する。
  setupApiTestEnv()
  const { fetchUserRecordWithCache } = await import('./fetchUserRecordWithCache.ts')
  setAuthenticatedUser(user)
  const recordFetchCounts = mockRecordFetch({ failUpdatedAt: true })

  // When
  const result = await fetchUserRecordWithCache('alice')

  // Then: レコードはAPIから返り、判定材料のないキャッシュは保存しない。
  assert.deepEqual(result.standard, recordResponse.standard)
  assert.equal(recordFetchCounts.get('alice'), 1)
  assert.equal(await db.userSongRecords.count(), 0)
})
