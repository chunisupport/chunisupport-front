import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { db } from '../../lib/db/cacheDB.ts'
import { clearAuthenticatedUser, setAuthenticatedUser } from '../../stores/authSession.ts'
import type { UserDTO } from '../../types/api.ts'

const originalFetch = globalThis.fetch
const API_BASE_URL = 'http://localhost:3000'

const user: UserDTO = {
  username: 'alice',
  account_type: 'PLAYER',
  is_private: false,
  last_score_update: null,
}

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
  await Promise.all([db.cacheMetadata.clear(), db.courses.clear(), db.userCourseRecords.clear()])
}

afterEach(resetTestState)

test('コースマスタとプレイ済みレコードを更新日時ごとに独立して再取得すること', async () => {
  // Given: 本人のコースマスタとレコードが別々のタイミングで更新される。
  setupApiTestEnv()
  setAuthenticatedUser(user)
  const requestedUrls: string[] = []
  let coursesUpdatedAt = '2026-07-15T09:00:00Z'
  let userUpdatedAt = '2026-07-15T10:00:00Z'
  let courseName = 'COURSE 1'
  let courseScore = 3_020_000
  globalThis.fetch = async (input) => {
    const url = String(input)
    requestedUrls.push(url)

    if (url.endsWith('/internal/courses/updated-at')) {
      return Response.json({ updated_at: coursesUpdatedAt })
    }
    if (url.endsWith('/internal/users/alice/updated-at')) {
      return Response.json({ updated_at: userUpdatedAt })
    }
    if (url.endsWith('/internal/courses')) {
      return Response.json({
        courses: [
          { display_id: 'course-1', idx: '50001', name: courseName, class: '1' },
          { display_id: 'course-2', idx: '50002', name: 'COURSE 2', class: '2' },
        ],
      })
    }
    if (url.endsWith('/internal/users/alice/record/courses')) {
      return Response.json({
        courses: [
          {
            display_id: 'course-1',
            idx: '50001',
            name: courseName,
            class: '1',
            is_played: true,
            score: courseScore,
            is_clear: true,
            combo_lamp: 'FULL COMBO',
            updated_at: userUpdatedAt,
          },
        ],
        meta: { updated_at: userUpdatedAt },
      })
    }

    throw new Error(`unexpected fetch: ${url}`)
  }
  const { fetchUserCourseRecordsWithCache } = await import('./fetchUserCourseRecordsWithCache.ts')

  // When: 同じ更新日時、マスタだけ更新、レコードだけ更新の順で取得する。
  const first = await fetchUserCourseRecordsWithCache('alice')
  const second = await fetchUserCourseRecordsWithCache('alice')
  coursesUpdatedAt = '2026-07-15T11:00:00Z'
  courseName = 'COURSE 1 UPDATED'
  const masterUpdated = await fetchUserCourseRecordsWithCache('alice')
  userUpdatedAt = '2026-07-15T12:00:00Z'
  courseScore = 3_025_000
  const recordUpdated = await fetchUserCourseRecordsWithCache('alice')

  // Then: 変更された側の一覧だけ再取得し、未プレイコースをマスタから補完する。
  assert.deepEqual(first, second)
  assert.equal(first.courses[0].is_played, true)
  assert.equal(first.courses[1].is_played, false)
  assert.equal(masterUpdated.courses[0].name, 'COURSE 1 UPDATED')
  assert.equal(masterUpdated.courses[0].score, 3_020_000)
  assert.equal(recordUpdated.courses[0].name, 'COURSE 1 UPDATED')
  assert.equal(recordUpdated.courses[0].score, 3_025_000)
  assert.equal(requestedUrls.filter((url) => url.endsWith('/internal/courses')).length, 2)
  assert.equal(
    requestedUrls.filter((url) => url.endsWith('/internal/users/alice/record/courses')).length,
    2
  )
  assert.equal(await db.courses.count(), 2)
  assert.equal(await db.userCourseRecords.count(), 1)
})
