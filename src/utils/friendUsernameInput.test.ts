import assert from 'node:assert/strict'
import test from 'node:test'
import { sanitizeFriendUsernameInput } from './friendUsernameInput'

test('大文字が小文字へ変換されること', () => {
  // Given
  const value = 'ChuniUSER'

  // When
  const result = sanitizeFriendUsernameInput(value)

  // Then
  assert.equal(result, 'chuniuser')
})

test('英数字以外の文字が取り除かれること', () => {
  // Given
  const value = 'chuni_user-01!'

  // When
  const result = sanitizeFriendUsernameInput(value)

  // Then
  assert.equal(result, 'chuniuser01')
})

test('全角文字や記号を含むペースト文字列でも許可文字だけ残ること', () => {
  // Given
  const value = ' Ａｂ ＣＤ user 123 あ '

  // When
  const result = sanitizeFriendUsernameInput(value)

  // Then
  assert.equal(result, 'user123')
})

test('空文字はそのまま空文字を返すこと', () => {
  // Given
  const value = ''

  // When
  const result = sanitizeFriendUsernameInput(value)

  // Then
  assert.equal(result, '')
})
