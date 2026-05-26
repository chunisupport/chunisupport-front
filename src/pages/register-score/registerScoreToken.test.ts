import assert from 'node:assert/strict'
import test from 'node:test'

import { isValidUploadToken, normalizeUploadTokenParam } from './registerScoreToken.ts'

test('normalizeUploadTokenParam: 単一のtokenを返す', () => {
  // Given
  const token = 'ad7ed422-de43-4fae-ac19-bf62323deb3a'

  // When
  const result = normalizeUploadTokenParam(token)

  // Then
  assert.equal(result, token)
})

test('normalizeUploadTokenParam: 複数指定時は先頭のtokenを返す', () => {
  // Given
  const tokens = ['ad7ed422-de43-4fae-ac19-bf62323deb3a', 'f47ac10b-58cc-4372-a567-0e02b2c3d479']

  // When
  const result = normalizeUploadTokenParam(tokens)

  // Then
  assert.equal(result, tokens[0])
})

test('isValidUploadToken: UUID v4形式のtokenを許可する', () => {
  // Given
  const token = 'ad7ed422-de43-4fae-ac19-bf62323deb3a'

  // When
  const result = isValidUploadToken(token)

  // Then
  assert.equal(result, true)
})

test('isValidUploadToken: UUID v4以外のtokenを拒否する', () => {
  // Given
  const token = 'ad7ed422-de43-3fae-ac19-bf62323deb3a'

  // When
  const result = isValidUploadToken(token)

  // Then
  assert.equal(result, false)
})
