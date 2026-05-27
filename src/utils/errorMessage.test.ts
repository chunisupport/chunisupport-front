import assert from 'node:assert/strict'
import test from 'node:test'

import { toUserFriendlyErrorMessage } from './errorMessage'

test('APIエラーコードがある場合は対応するユーザー向け文言に変換されること', () => {
  // Given
  const error = new Error('Internal Server Error') as Error & { code?: string }
  error.code = 'player_not_found'

  // When
  const result = toUserFriendlyErrorMessage(error)

  // Then
  assert.equal(result, 'プレイヤーが見つかりません')
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
