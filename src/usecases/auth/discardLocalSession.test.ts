import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import test from 'node:test'
import { loadTestModule } from '../../test/setupTestEnvironment'
import type { UserDTO } from '../../types/api'

/** テスト用のログイン中ユーザー */
const TEST_USER: UserDTO = {
  username: 'alice',
  account_type: 'PLAYER',
  is_private: false,
  last_score_update: null,
}

/**
 * 端末内のログイン状態の破棄処理と、検証に使うFirebase認証・認証状態・キャッシュDBを読み込む。
 * Firebase認証のサインアウトは、指定した処理へ差し替える。
 *
 * @param signOut - Firebase認証のサインアウトとして呼ばれる処理。
 * @returns 破棄処理と、認証状態・キャッシュDBの参照。
 */
const loadDiscardLocalSession = async (signOut: () => Promise<void>) => {
  const { discardLocalSession } = await loadTestModule(
    (cacheKey) => import(`./discardLocalSession.ts?cache=${cacheKey}`)
  )
  const { auth } = await import('../../lib/firebase.ts')
  Object.defineProperty(auth, 'signOut', { configurable: true, value: signOut })
  const { getAuthStatus, getAuthenticatedUser, setAuthenticatedUser } = await import(
    '../../stores/authSession.ts'
  )
  const { db } = await import('../../lib/db/cacheDB.ts')
  return { discardLocalSession, getAuthStatus, getAuthenticatedUser, setAuthenticatedUser, db }
}

test('サインアウトしてキャッシュを削除し、認証状態を未ログインにすること', async () => {
  // Given: ログイン中で、ユーザーのキャッシュがある端末
  let signOutCalls = 0
  const { discardLocalSession, getAuthStatus, getAuthenticatedUser, setAuthenticatedUser, db } =
    await loadDiscardLocalSession(async () => {
      signOutCalls++
    })
  setAuthenticatedUser(TEST_USER)
  await db.cacheMetadata.put({ key: 'userRecord', schemaVersion: 1, username: 'alice' })

  // When: 端末内のログイン状態を破棄する
  await discardLocalSession()

  // Then: サインアウトし、キャッシュと認証状態を消す
  assert.equal(signOutCalls, 1)
  assert.equal(await db.cacheMetadata.count(), 0)
  assert.equal(getAuthStatus(), 'unauthenticated')
  assert.equal(getAuthenticatedUser(), null)
})

test('サインアウトに失敗しても拒否せず、キャッシュと認証状態を消すこと', async () => {
  // Given: サインアウトが失敗する端末
  const { discardLocalSession, getAuthStatus, setAuthenticatedUser, db } =
    await loadDiscardLocalSession(async () => {
      throw new Error('network')
    })
  setAuthenticatedUser(TEST_USER)
  await db.cacheMetadata.put({ key: 'userRecord', schemaVersion: 1, username: 'alice' })

  // When: 端末内のログイン状態を破棄する
  await discardLocalSession()

  // Then: 例外を投げず、ログイン画面へ進める状態にする
  assert.equal(await db.cacheMetadata.count(), 0)
  assert.equal(getAuthStatus(), 'unauthenticated')
})
