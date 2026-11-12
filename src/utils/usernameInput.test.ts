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

/** 長さの境界値と範囲内の小文字英数字が形式上有効になることを検証する。 */
for (const { name, value } of [
  { name: '最小長の5文字', value: 'user1' },
  { name: '範囲内の11文字', value: 'currentuser' },
  { name: '最大長の50文字', value: 'a'.repeat(50) },
]) {
  test(`${name}の小文字英数字は有効になること`, () => {
    // Given: 許容される長さの小文字英数字。
    const input = value

    // When: ユーザー名の形式を検証する。
    const result = validateUsername(input)

    // Then: 現在のユーザー名との比較ではなく、形式として有効と判定する。
    assert.equal(result, null)
  })
}

test('アンダーバーを含むユーザー名は有効になること', () => {
  // Given
  const values = ['chuni_user', '_chuni', 'chuni_']

  // When
  const results = values.map((value) => validateUsername(value))

  // Then
  assert.deepEqual(results, [null, null, null])
})

test('アンダーバーのみで英数字を含まないユーザー名は形式エラーになること', () => {
  // Given
  const value = '_____'

  // When
  const result = validateUsername(value)

  // Then
  assert.equal(result, 'invalid')
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
  const invalidValues = ['ChuniUser', 'chuni-user', 'chuni user', 'ｃｈｕｎｉ']

  // When
  const results = invalidValues.map((value) => validateUsername(value))

  // Then
  assert.deepEqual(results, ['invalid', 'invalid', 'invalid', 'invalid'])
})

test('不正な username は API 呼び出し前の検証で例外になること', () => {
  // Given
  const value = 'Invalid User'

  // When & Then
  assert.throws(() => assertValidUsername(value), TypeError)
})
