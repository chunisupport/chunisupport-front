import assert from 'node:assert/strict'
import test from 'node:test'
import { isNotFoundApiError } from './apiError'

test('404系のAPIエラーだけをNot Foundとして判定すること', () => {
  // Given
  const cases = [
    { error: { status: 404 }, expected: true },
    { error: { code: 'user_not_found' }, expected: true },
    { error: { code: 'song_not_found' }, expected: true },
    { error: { status: 500, code: 'internal_server_error' }, expected: false },
  ] as const

  // When
  const results = cases.map(({ error }) => isNotFoundApiError(error))

  // Then
  assert.deepEqual(
    results,
    cases.map(({ expected }) => expected)
  )
})
