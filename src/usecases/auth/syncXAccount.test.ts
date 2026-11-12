import assert from 'node:assert/strict'
import test from 'node:test'
import type { UserCredential } from 'firebase/auth'
import { loadTestModule } from '../../test/setupTestEnvironment'

/**
 * テスト用の公開環境変数を設定して、X アカウント同期モジュールを遅延読み込みする。
 * @returns X アカウント同期モジュール。
 */
const loadSyncXAccountModule = () => loadTestModule(() => import('./syncXAccount.ts'))

/**
 * ポップアップ認証の結果を、Firebase が @ID を読み取る項目だけで組み立てる。
 * @param providerId - 認証に使った Firebase の providerId。
 * @param screenName - 認証結果に含まれる X の @ID。
 * @returns テスト用の認証結果。
 */
const createCredential = (providerId: string, screenName: string): UserCredential =>
  ({
    providerId,
    operationType: 'signIn',
    user: { isAnonymous: false },
    _tokenResponse: { providerId, screenName, rawUserInfo: '{}' },
  }) as unknown as UserCredential

test('Xでの認証結果から@IDを読み取ること', async () => {
  // Given: X で認証した結果
  const { readXUsernameFromResult } = await loadSyncXAccountModule()
  const result = createCredential('twitter.com', 'alice_x')

  // When
  const username = readXUsernameFromResult(result)

  // Then
  assert.equal(username, 'alice_x')
})

test('X以外での認証結果からは@IDを読み取らないこと', async () => {
  // Given: Google で認証した結果
  const { readXUsernameFromResult } = await loadSyncXAccountModule()
  const result = createCredential('google.com', 'alice_x')

  // When
  const username = readXUsernameFromResult(result)

  // Then
  assert.equal(username, undefined)
})

test('Xでの認証結果を保持し、同じユーザーの取り出しで返すこと', async () => {
  // Given: X で認証した結果を保持した状態
  const { holdXAuthResultForSignup, takeHeldXAuthResult } = await loadSyncXAccountModule()
  const held = {
    providerId: 'twitter.com',
    user: { uid: 'uid-1' },
  } as unknown as UserCredential
  holdXAuthResultForSignup(held)

  // When
  const result = takeHeldXAuthResult('uid-1')

  // Then
  assert.equal(result, held)
})

test('別のユーザーの取り出しでは保持したXの認証結果を使わないこと', async () => {
  // Given: X で認証した結果を保持した状態
  const { holdXAuthResultForSignup, takeHeldXAuthResult } = await loadSyncXAccountModule()
  const held = {
    providerId: 'twitter.com',
    user: { uid: 'uid-1' },
  } as unknown as UserCredential
  holdXAuthResultForSignup(held)

  // When
  const result = takeHeldXAuthResult('uid-2')

  // Then
  assert.equal(result, undefined)
})

test('X以外での認証結果は保持せず、取り出しでも使わないこと', async () => {
  // Given: Google で認証した結果を保持しようとした状態
  const { holdXAuthResultForSignup, takeHeldXAuthResult } = await loadSyncXAccountModule()
  const googleResult = {
    providerId: 'google.com',
    user: { uid: 'uid-1' },
  } as unknown as UserCredential
  holdXAuthResultForSignup(googleResult)

  // When
  const result = takeHeldXAuthResult('uid-1')

  // Then
  assert.equal(result, undefined)
})
