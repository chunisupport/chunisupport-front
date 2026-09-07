import assert from 'node:assert/strict'
import test from 'node:test'
import type { AccountType } from '../types/api'
import { canEditSongMaster } from './songEditorRole'

test('ADMINとEDITORを楽曲マスタ編集可能と判定すること', () => {
  // Given
  const accountTypes: AccountType[] = ['ADMIN', 'EDITOR']

  // When
  const results = accountTypes.map(canEditSongMaster)

  // Then
  assert.deepEqual(results, [true, true])
})

test('PLAYERとEXTDEVを楽曲マスタ編集可能と判定しないこと', () => {
  // Given
  const accountTypes: AccountType[] = ['PLAYER', 'EXTDEV']

  // When
  const results = accountTypes.map(canEditSongMaster)

  // Then
  assert.deepEqual(results, [false, false])
})

test('アカウント種別が未確定の場合は楽曲マスタ編集可能と判定しないこと', () => {
  // Given
  const accountType = undefined

  // When
  const result = canEditSongMaster(accountType)

  // Then
  assert.equal(result, false)
})
