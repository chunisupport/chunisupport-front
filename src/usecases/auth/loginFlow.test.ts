import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createMaintenanceStaffRequiredError,
  isInvalidTokenLoginError,
  isMaintenanceModeLoginError,
  isMaintenanceStaffRequiredError,
  isUnregisteredLoginError,
  normalizeRedirectParam,
  resolveMaintenanceLoginDestination,
} from './loginFlow.ts'

test('normalizeRedirectParam: 複数のredirect値がある場合は先頭を返す', () => {
  // Given
  const redirect = ['/admin/maintenance', '/editor/songs']

  // When
  const result = normalizeRedirectParam(redirect)

  // Then
  assert.equal(result, '/admin/maintenance')
})

test('isUnregisteredLoginError: 未登録ユーザーのAPIエラーを判定する', () => {
  // Given
  const error = Object.assign(new Error('not found'), { code: 'user_not_found' })

  // When
  const result = isUnregisteredLoginError(error)

  // Then
  assert.equal(result, true)
})

test('isInvalidTokenLoginError: トップレベルのinvalid_tokenを判定する', () => {
  // Given
  const error = Object.assign(new Error('invalid token'), { code: 'invalid_token' })

  // When
  const result = isInvalidTokenLoginError(error)

  // Then
  assert.equal(result, true)
  assert.equal(isUnregisteredLoginError(error), true)
})

test('isInvalidTokenLoginError: ネストしたinvalid_tokenを判定する', () => {
  // Given
  const error = { error: { code: 'invalid_token' } }

  // When & Then
  assert.equal(isInvalidTokenLoginError(error), true)
})

test('isMaintenanceModeLoginError: ネストしたmaintenance_modeを判定する', () => {
  // Given
  const error = { error: { code: 'maintenance_mode' } }

  // When
  const result = isMaintenanceModeLoginError(error)

  // Then
  assert.equal(result, true)
  assert.equal(isUnregisteredLoginError(error), false)
})

test('resolveMaintenanceLoginDestination: ADMINは既定で管理画面へ遷移する', () => {
  // Given & When
  const result = resolveMaintenanceLoginDestination('ADMIN')

  // Then
  assert.deepEqual(result, { kind: 'allowed', path: '/admin' })
})

test('resolveMaintenanceLoginDestination: EDITORは既定で楽曲編集画面へ遷移する', () => {
  // Given & When
  const result = resolveMaintenanceLoginDestination('EDITOR')

  // Then
  assert.deepEqual(result, { kind: 'allowed', path: '/editor/songs' })
})

test('resolveMaintenanceLoginDestination: 安全なredirectを既定遷移先より優先する', () => {
  // Given
  const redirect = '/admin/maintenance?tab=status'

  // When
  const result = resolveMaintenanceLoginDestination('ADMIN', redirect)

  // Then
  assert.deepEqual(result, { kind: 'allowed', path: redirect })
})

test('resolveMaintenanceLoginDestination: 外部redirectは拒否して既定遷移先を返す', () => {
  // Given
  const redirect = 'https://evil.example/'

  // When
  const result = resolveMaintenanceLoginDestination('EDITOR', redirect)

  // Then
  assert.deepEqual(result, { kind: 'allowed', path: '/editor/songs' })
})

test('resolveMaintenanceLoginDestination: スタッフログイン画面自身へのredirectは拒否する', () => {
  // Given: ルーターが同じ画面として扱う大文字・重複スラッシュ付きredirect
  const redirect = '/MAINTENANCE//LOGIN/?redirect=%2Fadmin'

  // When
  const result = resolveMaintenanceLoginDestination('ADMIN', redirect)

  // Then
  assert.deepEqual(result, { kind: 'allowed', path: '/admin' })
})

test('resolveMaintenanceLoginDestination: PLAYERは拒否する', () => {
  // Given & When
  const result = resolveMaintenanceLoginDestination('PLAYER', '/admin')

  // Then
  assert.deepEqual(result, { kind: 'forbidden' })
})

test('resolveMaintenanceLoginDestination: EXTDEVは拒否する', () => {
  // Given & When
  const result = resolveMaintenanceLoginDestination('EXTDEV', '/editor/songs')

  // Then
  assert.deepEqual(result, { kind: 'forbidden' })
})

test('isMaintenanceStaffRequiredError: 専用の内部エラーだけを判定する', () => {
  // Given
  const error = createMaintenanceStaffRequiredError()

  // When & Then
  assert.equal(isMaintenanceStaffRequiredError(error), true)
  assert.equal(isMaintenanceStaffRequiredError(new Error('other')), false)
})
