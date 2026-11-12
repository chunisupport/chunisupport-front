import assert from 'node:assert/strict'
import test from 'node:test'

import { AUTH_PROVIDER_BY_KIND, AUTH_PROVIDERS } from '../../constants/authProviders.ts'
import {
  canUnlinkAuthProvider,
  type LinkedAuthAccount,
  resolveAuthAccountName,
  resolveAuthAccountSummary,
  resolveReauthProviderKind,
  selectVisibleAuthProviders,
} from './authProviders.ts'

const googleAccount: LinkedAuthAccount = {
  providerId: 'google.com',
  uid: 'google-uid',
  displayName: 'Alice',
  email: 'alice@example.com',
}
const xAccount: LinkedAuthAccount = {
  providerId: 'twitter.com',
  uid: '1234567890',
  displayName: 'アリス',
  email: null,
}
const passwordAccount: LinkedAuthAccount = {
  providerId: 'password',
  uid: 'staff@example.com',
  displayName: null,
  email: 'staff@example.com',
}

test('Googleアカウントはメールアドレスで表示すること', () => {
  // Given
  const accounts = [googleAccount]

  // When
  const result = resolveAuthAccountSummary(accounts)

  // Then
  assert.deepEqual(result, { kind: 'google', label: 'Google', name: 'alice@example.com' })
})

test('Xアカウントは表示名で表示すること', () => {
  // Given
  const accounts = [xAccount]

  // When
  const result = resolveAuthAccountSummary(accounts)

  // Then
  assert.deepEqual(result, { kind: 'x', label: 'X', name: 'アリス' })
})

test('認証直後に得たXの@IDがあれば@IDで表示すること', () => {
  // Given: 新規登録の認証結果から @ID を得ている
  const accounts = [xAccount]
  const xUsername = 'alice_x'

  // When
  const result = resolveAuthAccountSummary(accounts, xUsername)

  // Then
  assert.deepEqual(result, { kind: 'x', label: 'X', name: '@alice_x' })
})

for (const { caseName, xUsername } of [
  { caseName: 'Xの@IDがある場合', xUsername: 'alice_x' },
  { caseName: 'Xの@IDがない場合', xUsername: undefined },
]) {
  test(`GoogleとXの両方を連携しているとき、${caseName}もGoogleのメールアドレスを表示すること`, () => {
    // Given: Xを先に連携しており、Googleも連携している。
    const accounts = [xAccount, googleAccount]

    // When
    const result = resolveAuthAccountSummary(accounts, xUsername)

    // Then: 代表プロバイダと表示内容の両方がGoogleになる。
    assert.deepEqual(result, { kind: 'google', label: 'Google', name: 'alice@example.com' })
  })
}

test('対応するプロバイダが連携されていない場合はアカウント概要がないこと', () => {
  // Given
  const accounts = [passwordAccount]

  // When
  const result = resolveAuthAccountSummary(accounts)

  // Then
  assert.equal(result, undefined)
})

test('Xだけを連携している場合はXで再認証すること', () => {
  // Given
  const accounts = [xAccount]

  // When
  const result = resolveReauthProviderKind(accounts)

  // Then
  assert.equal(result, 'x')
})

test('対応するプロバイダが連携されていない場合はGoogleで再認証すること', () => {
  // Given
  const accounts = [passwordAccount]

  // When
  const result = resolveReauthProviderKind(accounts)

  // Then
  assert.equal(result, 'google')
})

test('他のログイン方法が残る場合は連携を解除できること', () => {
  // Given
  const accounts = [googleAccount, xAccount]

  // When
  const result = canUnlinkAuthProvider(accounts, 'x')

  // Then
  assert.equal(result, true)
})

test('最後のログイン方法は連携を解除できないこと', () => {
  // Given
  const accounts = [xAccount]

  // When
  const result = canUnlinkAuthProvider(accounts, 'x')

  // Then
  assert.equal(result, false)
})

test('未連携のプロバイダは連携を解除できないこと', () => {
  // Given
  const accounts = [googleAccount, passwordAccount]

  // When
  const result = canUnlinkAuthProvider(accounts, 'x')

  // Then
  assert.equal(result, false)
})

test('保存済みのXアカウントが連携中のアカウントと一致する場合は@IDで表示すること', () => {
  // Given
  const savedXAccount = { id: '1234567890', username: 'alice_x' }

  // When
  const result = resolveAuthAccountName(xAccount, 'x', savedXAccount)

  // Then
  assert.equal(result, '@alice_x')
})

test('保存済みのXアカウントが別のアカウントの場合は表示名で表示すること', () => {
  // Given
  const staleXAccount = { id: '999', username: 'previous_x' }

  // When
  const result = resolveAuthAccountName(xAccount, 'x', staleXAccount)

  // Then
  assert.equal(result, 'アリス')
})

test('Xアカウントを保存していない場合は表示名で表示すること', () => {
  // Given
  const savedXAccount = null

  // When
  const result = resolveAuthAccountName(xAccount, 'x', savedXAccount)

  // Then
  assert.equal(result, 'アリス')
})

test('feature-flagが有効な環境ではフラグ付きの認証プロバイダも表示順のまま表示すること', () => {
  // Given: 全ての機能が有効
  const isFeatureEnabled = () => true

  // When
  const result = selectVisibleAuthProviders(AUTH_PROVIDERS, isFeatureEnabled)

  // Then
  assert.deepEqual(
    result.map((provider) => provider.kind),
    ['google', 'x']
  )
})

test('feature-flagが無効な環境ではフラグ付きの認証プロバイダだけを表示しないこと', () => {
  // Given: X でのログイン（x_login）だけが無効
  const isFeatureEnabled = (name: string) => name !== 'x_login'

  // When
  const result = selectVisibleAuthProviders(AUTH_PROVIDERS, isFeatureEnabled)

  // Then: フラグを持たない Google は常に表示する
  assert.deepEqual(
    result.map((provider) => provider.kind),
    ['google']
  )
})

test('表示しない認証プロバイダしか残らない場合は連携を解除できないこと', () => {
  // Given: Google と X を連携しているが、X は表示しない環境
  const accounts = [googleAccount, xAccount]
  const visibleProviders = [AUTH_PROVIDER_BY_KIND.google]

  // When
  const result = canUnlinkAuthProvider(accounts, 'google', visibleProviders)

  // Then: 解除するとログイン画面から使える方法がなくなる
  assert.equal(result, false)
})
