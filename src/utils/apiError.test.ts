import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isForbiddenApiError,
  isNotFoundApiError,
  isNotFoundOrInvalidDisplayIdApiError,
  isPlayerNotLinkedApiError,
} from './apiError'

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

test('403系のAPIエラーだけをForbiddenとして判定すること', () => {
  // Given
  const cases = [
    { error: { status: 403 }, expected: true },
    { error: { code: 'forbidden' }, expected: true },
    { error: { status: 404, code: 'user_not_found' }, expected: false },
    { error: { status: 500, code: 'internal_server_error' }, expected: false },
  ] as const

  // When
  const results = cases.map(({ error }) => isForbiddenApiError(error))

  // Then
  assert.deepEqual(
    results,
    cases.map(({ expected }) => expected)
  )
})

test('存在しない表示IDと形式不正の表示IDをNot Found相当として判定すること', () => {
  // Given
  const cases = [
    { error: { status: 404 }, expected: true },
    { error: { code: 'song_not_found' }, expected: true },
    { error: { status: 422, code: 'validation_failed' }, expected: true },
    { error: { status: 500, code: 'internal_error' }, expected: false },
  ] as const

  // When
  const results = cases.map(({ error }) => isNotFoundOrInvalidDisplayIdApiError(error))

  // Then
  assert.deepEqual(
    results,
    cases.map(({ expected }) => expected)
  )
})

test('関数をAPIエラーとして扱わないこと', () => {
  // Given
  const functionError = Object.assign(() => undefined, { status: 404, code: 'user_not_found' })

  // When
  const result = isNotFoundApiError(functionError)

  // Then
  assert.equal(result, false)
})

test('プレイヤーデータ未連携のAPIエラーだけを未連携として判定すること', () => {
  // Given
  const cases = [
    { error: { status: 404, code: 'player_not_linked' }, expected: true },
    { error: { status: 404, code: 'user_not_found' }, expected: false },
    { error: { status: 404 }, expected: false },
    { error: null, expected: false },
  ] as const

  // When
  const results = cases.map(({ error }) => isPlayerNotLinkedApiError(error))

  // Then
  assert.deepEqual(
    results,
    cases.map(({ expected }) => expected)
  )
})
