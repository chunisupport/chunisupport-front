import assert from 'node:assert/strict'
import test from 'node:test'
import type { AccountType } from '../types/api'
import { isMaintenanceStaff } from './maintenanceRole'

test('ADMINとEDITORをメンテナンススタッフと判定すること', () => {
  // Given
  const accountTypes: AccountType[] = ['ADMIN', 'EDITOR']

  // When
  const results = accountTypes.map(isMaintenanceStaff)

  // Then
  assert.deepEqual(results, [true, true])
})

test('PLAYERとEXTDEVをメンテナンススタッフと判定しないこと', () => {
  // Given
  const accountTypes: AccountType[] = ['PLAYER', 'EXTDEV']

  // When
  const results = accountTypes.map(isMaintenanceStaff)

  // Then
  assert.deepEqual(results, [false, false])
})

test('アカウント種別が未確定の場合はメンテナンススタッフと判定しないこと', () => {
  // Given
  const accountType = undefined

  // When
  const result = isMaintenanceStaff(accountType)

  // Then
  assert.equal(result, false)
})
