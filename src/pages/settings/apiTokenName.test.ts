import assert from 'node:assert/strict'
import test from 'node:test'
import { isApiTokenNameError, isValidApiTokenName, normalizeApiTokenName } from './apiTokenName'

test('APIトークン名は前後空白を除去して正規化する', () => {
  // Given: 前後に空白を含むAPIトークン名。
  const value = '  Discord Bot  '

  // When: API送信用に正規化する。
  const result = normalizeApiTokenName(value)

  // Then: 前後空白だけが除去される。
  assert.equal(result, 'Discord Bot')
})

test('APIトークン名はUnicode文字数で50文字まで許可する', () => {
  // Given: UTF-16では100コード単位となる50個の絵文字。
  const value = '🎮'.repeat(50)

  // When: APIと同じ文字数制約で検証する。
  const result = isValidApiTokenName(value)

  // Then: 50文字として受け付ける。
  assert.equal(result, true)
})

test('APIトークン名は空文字、51文字、制御文字を拒否する', () => {
  // Given: API制約に違反する入力値。
  const values = ['   ', 'a'.repeat(51), 'Discord\tBot']

  // When: 各入力値を検証する。
  const results = values.map(isValidApiTokenName)

  // Then: すべて無効と判定する。
  assert.deepEqual(results, [false, false, false])
})

test('APIトークン名に紐づくAPIエラーだけを入力エラーとして判定する', () => {
  // Given: 名前不正、名前重複、通信障害に相当するエラー。
  const errors = [
    { code: 'invalid_api_token_name' },
    { code: 'api_token_name_conflict' },
    { code: 'service_unavailable' },
  ]

  // When: 入力欄へ関連付けるべきエラーか判定する。
  const results = errors.map(isApiTokenNameError)

  // Then: 名前に直接関係する2種類だけを入力エラーとする。
  assert.deepEqual(results, [true, true, false])
})
