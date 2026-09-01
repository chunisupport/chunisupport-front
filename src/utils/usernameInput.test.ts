import assert from 'node:assert/strict'
import test from 'node:test'
import { assertValidUsername, validateUsername } from './usernameInput'

test('空文字は必須エラーになること', () => {
  // Given
  const value = ''

  // When
  const result = validateUsername(value)

  // Then
  assert.equal(result, 'required')
})

test('5〜50文字の小文字英数字は有効になること', () => {
  // Given
  const minimumLengthValue = 'user1'
  const maximumLengthValue = 'a'.repeat(50)

  // When
  const minimumLengthResult = validateUsername(minimumLengthValue)
  const maximumLengthResult = validateUsername(maximumLengthValue)

  // Then
  assert.equal(minimumLengthResult, null)
  assert.equal(maximumLengthResult, null)
})

test('5文字未満または50文字超過は形式エラーになること', () => {
  // Given
  const tooShortValue = 'user'
  const tooLongValue = 'a'.repeat(51)

  // When
  const tooShortResult = validateUsername(tooShortValue)
  const tooLongResult = validateUsername(tooLongValue)

  // Then
  assert.equal(tooShortResult, 'invalid')
  assert.equal(tooLongResult, 'invalid')
})

test('大文字・記号・空白・全角文字は形式エラーになり入力値を変換しないこと', () => {
  // Given
  const invalidValues = ['ChuniUser', 'chuni_user', 'chuni user', 'ｃｈｕｎｉ']

  // When
  const results = invalidValues.map((value) => validateUsername(value))

  // Then
  assert.deepEqual(results, ['invalid', 'invalid', 'invalid', 'invalid'])
  assert.deepEqual(invalidValues, ['ChuniUser', 'chuni_user', 'chuni user', 'ｃｈｕｎｉ'])
})

test('不正な username は API 呼び出し前の検証で例外になること', () => {
  // Given
  const value = 'Invalid User'

  // When & Then
  assert.throws(() => assertValidUsername(value), TypeError)
})

test('現在と同じユーザー名も形式上は有効になること', () => {
  // Given: 現在のユーザー名と同じ入力値。
  const value = 'currentuser'

  // When: 共通のユーザー名形式を検証する。
  const result = validateUsername(value)

  // Then: 変更有無の判定とは分離し、形式上は有効とする。
  assert.equal(result, null)
})
