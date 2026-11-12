import assert from 'node:assert/strict'
import test from 'node:test'

import { isAuthPopupClosedError, toUserFriendlyErrorMessage } from './errorMessage'

for (const code of ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password']) {
  test(`メール認証の${code}は共通の認証失敗案内で内部情報を隠す`, () => {
    // Given
    const error = { code, message: 'secret' }

    // When
    const message = toUserFriendlyErrorMessage(error)

    // Then
    assert.equal(message, '認証情報が無効です。もう一度ログインしてください。')
    assert.doesNotMatch(message, /secret/)
  })
}

test('認証ポップアップを閉じたエラーは中断として判定されること', () => {
  // Given
  const error = Object.assign(new Error('popup closed'), { code: 'auth/popup-closed-by-user' })

  // When
  const result = isAuthPopupClosedError(error)

  // Then
  assert.equal(result, true)
})

test('ポップアップ以外の認証エラーやコードのない値は中断として判定されないこと', () => {
  // Given
  const values: unknown[] = [
    { code: 'auth/user-mismatch' },
    { code: 'auth/cancelled-popup-request' },
    new Error('no code'),
    'auth/popup-closed-by-user',
    null,
  ]

  // When
  const results = values.map(isAuthPopupClosedError)

  // Then
  assert.deepEqual(results, [false, false, false, false, false])
})

test('APIエラーコードがある場合は対応するユーザー向け文言に変換されること', () => {
  // Given
  const error = new Error('Internal Server Error') as Error & { code?: string }
  error.code = 'player_not_found'

  // When
  const result = toUserFriendlyErrorMessage(error)

  // Then
  assert.equal(result, 'プレイヤーが見つかりません')
})

test('user_not_found はユーザー未存在の文言に変換されること', () => {
  // Given
  const error = new Error('Not Found') as Error & { code?: string }
  error.code = 'user_not_found'

  // When
  const result = toUserFriendlyErrorMessage(error)

  // Then
  assert.equal(result, 'ユーザーが見つかりません')
})

test('Turnstileエラーコードがある場合は認証確認の失敗文言に変換されること', () => {
  // Given
  const error = new Error('Unauthorized') as Error & { code?: string }
  error.code = 'invalid_turnstile_token'

  // When
  const result = toUserFriendlyErrorMessage(error)

  // Then
  assert.equal(result, '認証確認に失敗しました。もう一度お試しください')
})

test('Firebaseエラーコードがある場合はSDKの生メッセージを表示しないこと', () => {
  // Given
  const error = new Error(
    'Firebase: A network error (such as timeout, interrupted connection or unreachable host) has occurred.'
  ) as Error & { code?: string }
  error.code = 'auth/network-request-failed'

  // When
  const result = toUserFriendlyErrorMessage(error)

  // Then
  assert.equal(result, '通信に失敗しました。ネットワーク接続を確認してもう一度お試しください。')
})

test('未知のErrorはmessageを返さずfallback文言を返すこと', () => {
  // Given
  const error = new Error('database password leaked in stack trace')

  // When
  const result = toUserFriendlyErrorMessage(error, '保存に失敗しました。')

  // Then
  assert.equal(result, '保存に失敗しました。')
})

test('5xxステータスはHTTPステータステキストを表示せずサービス一時不可の文言に変換されること', () => {
  // Given
  const error = new Error('HTTP 500') as Error & { status?: number }
  error.status = 500

  // When
  const result = toUserFriendlyErrorMessage(error)

  // Then
  assert.equal(result, 'サービスが一時的に利用できません')
})

test('コードを持つ関数値はオブジェクト以外としてfallback文言を返すこと', () => {
  // Given: エラーコードを持つ関数値。
  const error = Object.assign(() => {}, { code: 'player_not_found' })

  // When
  const result = toUserFriendlyErrorMessage(error, '保存に失敗しました。')

  // Then: typeofがobjectではないためfallbackを返す。
  assert.equal(result, '保存に失敗しました。')
})
