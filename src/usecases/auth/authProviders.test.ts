import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canUnlinkAuthProvider,
  type LinkedAuthAccount,
  resolveAuthAccountSummary,
  resolveReauthProviderKind,
} from './authProviders.ts'

const googleAccount: LinkedAuthAccount = {
  providerId: 'google.com',
  displayName: 'Alice',
  email: 'alice@example.com',
}
const xAccount: LinkedAuthAccount = {
  providerId: 'twitter.com',
  displayName: 'アリス',
  email: null,
}
const passwordAccount: LinkedAuthAccount = {
  providerId: 'password',
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

test('GoogleとXの両方を連携している場合はGoogleを代表とすること', () => {
  // Given
  const accounts = [xAccount, googleAccount]

  // When
  const result = resolveAuthAccountSummary(accounts)

  // Then
  assert.equal(result?.kind, 'google')
})

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
