import assert from 'node:assert/strict'
import test from 'node:test'
import { isNotFoundApiError } from './apiError'

test('status が 404 の場合は Not Found として判定されること', () => {
  // Given
  const error = { status: 404 }

  // When
  const result = isNotFoundApiError(error)

  // Then
  assert.equal(result, true)
})

test('code が user_not_found の場合は Not Found として判定されること', () => {
  // Given
  const error = { code: 'user_not_found' }

  // When
  const result = isNotFoundApiError(error)

  // Then
  assert.equal(result, true)
})

test('code が song_not_found の場合は Not Found として判定されること', () => {
  // Given
  const error = { code: 'song_not_found' }

  // When
  const result = isNotFoundApiError(error)

  // Then
  assert.equal(result, true)
})

test('404 ではないエラーは Not Found として判定されないこと', () => {
  // Given
  const error = { status: 500, code: 'internal_server_error' }

  // When
  const result = isNotFoundApiError(error)

  // Then
  assert.equal(result, false)
})
