import assert from 'node:assert/strict'
import test from 'node:test'
import type { AccountType } from '../types/api'
import { canIssueReadWriteApiToken, resolveApiTokenIssuePermission } from './apiTokenPermission'

test('EDITORとADMINは書き込み権限付きAPIトークンを発行できる', () => {
  // Given: 書き込み権限を持つアカウント種別。
  const accountTypes: AccountType[] = ['EDITOR', 'ADMIN']

  // When: APIトークン発行可否を判定する。
  const results = accountTypes.map(canIssueReadWriteApiToken)

  // Then: どちらも発行可能と判定する。
  assert.deepEqual(results, [true, true])
})

test('PLAYER、EXTDEV、未認証ユーザーは書き込み権限付きAPIトークンを発行できない', () => {
  // Given: 書き込み権限を持たないアカウント種別。
  const accountTypes: (AccountType | undefined)[] = ['PLAYER', 'EXTDEV', undefined]

  // When: APIトークン発行可否を判定する。
  const results = accountTypes.map(canIssueReadWriteApiToken)

  // Then: どれも発行不可と判定する。
  assert.deepEqual(results, [false, false, false])
})

test('書き込み権限を持たないユーザーの選択値はreadへ固定する', () => {
  // Given: PLAYERがread_writeを選択した状態。
  const accountType: AccountType = 'PLAYER'

  // When: 発行権限を解決する。
  const permission = resolveApiTokenIssuePermission(accountType, 'read_write')

  // Then: APIへ送る権限はreadになる。
  assert.equal(permission, 'read')
})

test('EDITORまたはADMINが選択した権限はそのまま維持する', () => {
  // Given: 書き込み権限を持つユーザーの選択値。
  const accountTypes: AccountType[] = ['EDITOR', 'ADMIN']

  // When: read_writeの発行権限を解決する。
  const permissions = accountTypes.map((accountType) =>
    resolveApiTokenIssuePermission(accountType, 'read_write')
  )

  // Then: 選択値を維持する。
  assert.deepEqual(permissions, ['read_write', 'read_write'])
})
