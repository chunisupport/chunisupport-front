import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveGoogleRegistrationEligibility } from './registrationEligibility.ts'

test('バックエンドユーザーが存在するGoogleアカウントは登録済みとして判定する', async () => {
  // Given
  const fetchCurrentUser = async () => ({ username: 'alice' })

  // When
  const result = await resolveGoogleRegistrationEligibility(fetchCurrentUser)

  // Then
  assert.equal(result, 'registered')
})

test('user_not_foundの場合は新規登録可能として判定する', async () => {
  // Given
  const fetchCurrentUser = async () => {
    const error = new Error('user not found') as Error & { code?: string }
    error.code = 'user_not_found'
    throw error
  }

  // When
  const result = await resolveGoogleRegistrationEligibility(fetchCurrentUser)

  // Then
  assert.equal(result, 'available')
})

test('invalid_tokenの場合は新規登録可能として判定する', async () => {
  // Given
  const fetchCurrentUser = async () => {
    const error = new Error('invalid token') as Error & { code?: string }
    error.code = 'invalid_token'
    throw error
  }

  // When
  const result = await resolveGoogleRegistrationEligibility(fetchCurrentUser)

  // Then
  assert.equal(result, 'available')
})

test('未登録由来以外のエラーはそのまま送出する', async () => {
  // Given
  const expectedError = new Error('network error')
  const fetchCurrentUser = async () => {
    throw expectedError
  }

  // When & Then
  await assert.rejects(() => resolveGoogleRegistrationEligibility(fetchCurrentUser), expectedError)
})
