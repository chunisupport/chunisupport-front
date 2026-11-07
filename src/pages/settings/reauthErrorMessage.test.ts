import assert from 'node:assert/strict'
import test from 'node:test'
import { errorMessages } from '../../types/api'
import { ACCOUNT_DELETE_COPY, USERNAME_CHANGE_COPY } from './AccountSettings.constants.ts'
import { resolveReauthErrorMessage } from './reauthErrorMessage'

/**
 * APIやFirebaseが投げるコード付きエラーを作成する。
 *
 * @param code - エラーコード。
 * @param status - HTTPステータス。
 * @returns コードとステータスを持つエラー。
 */
const codedError = (code: string, status?: number) =>
  Object.assign(new Error('raw message'), { code, status })

test('再認証で別アカウントが選ばれた場合は操作ごとの文言を返すこと', () => {
  // Given: Firebaseのauth/user-mismatchエラー
  const error = codedError('auth/user-mismatch')

  // When: 退会とユーザーネーム変更の文言で変換する
  const accountMessage = resolveReauthErrorMessage(error, ACCOUNT_DELETE_COPY)
  const usernameMessage = resolveReauthErrorMessage(error, USERNAME_CHANGE_COPY)

  // Then: それぞれの操作欄の文言になる
  assert.equal(accountMessage, ACCOUNT_DELETE_COPY.userMismatch)
  assert.equal(usernameMessage, USERNAME_CHANGE_COPY.userMismatch)
})

test('401のrecent_sign_in_requiredは有効期限切れとして案内すること', () => {
  // Given: 再認証から確定までに期限が切れたAPIの401エラー
  const error = codedError('recent_sign_in_required', 401)

  // When: 退会の文言で変換する
  const message = resolveReauthErrorMessage(error, ACCOUNT_DELETE_COPY)

  // Then: やり直しを促す文言になる
  assert.equal(message, ACCOUNT_DELETE_COPY.recentSignInExpired)
})

test('その他の401系エラーはAPIエラーコードの文言を返すこと', () => {
  // Given: トークン期限切れとコードなしの401エラー
  const tokenExpired = codedError('token_expired', 401)
  const statusOnly = Object.assign(new Error('raw message'), { status: 401 })

  // When: ユーザーネーム変更の文言で変換する
  const tokenExpiredMessage = resolveReauthErrorMessage(tokenExpired, USERNAME_CHANGE_COPY)
  const statusOnlyMessage = resolveReauthErrorMessage(statusOnly, USERNAME_CHANGE_COPY)

  // Then: 内部メッセージではなくユーザー向けの文言になる
  assert.equal(tokenExpiredMessage, errorMessages.token_expired)
  assert.equal(statusOnlyMessage, errorMessages.unauthorized)
})

test('認証ポップアップを閉じた中断はエラーを表示しないこと', () => {
  // Given: ユーザーが再認証ポップアップを閉じたエラー
  const error = codedError('auth/popup-closed-by-user')

  // When: 退会の文言で変換する
  const message = resolveReauthErrorMessage(error, ACCOUNT_DELETE_COPY)

  // Then: 表示しない
  assert.equal(message, null)
})

test('種別を特定できないエラーは操作ごとの失敗文言を返すこと', () => {
  // Given: コードもステータスもないエラー
  const error = new Error('network down')

  // When: 退会の文言で変換する
  const message = resolveReauthErrorMessage(error, ACCOUNT_DELETE_COPY)

  // Then: 内部メッセージを露出せず失敗文言になる
  assert.equal(message, ACCOUNT_DELETE_COPY.failure)
})
