import assert from 'node:assert/strict'
import test from 'node:test'
import { MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS } from '../constants/maintenance'
import { isMaintenanceModeError, parseRetryAfterSeconds } from './maintenanceError'

test('503かつmaintenance_modeの場合だけメンテナンスエラーと判定すること', () => {
  // Given
  const status = 503
  const error = { error: { status: 503, code: 'maintenance_mode' } }

  // When
  const result = isMaintenanceModeError(status, error)

  // Then
  assert.equal(result, true)
})

test('503でもservice_unavailableはメンテナンスエラーと判定しないこと', () => {
  // Given
  const status = 503
  const error = { error: { status: 503, code: 'service_unavailable' } }

  // When
  const result = isMaintenanceModeError(status, error)

  // Then
  assert.equal(result, false)
})

test('maintenance_modeでも503以外はメンテナンスエラーと判定しないこと', () => {
  // Given
  const status = 500
  const error = { error: { status: 500, code: 'maintenance_mode' } }

  // When
  const result = isMaintenanceModeError(status, error)

  // Then
  assert.equal(result, false)
})

test('不正なエラー本文はメンテナンスエラーと判定しないこと', () => {
  // Given
  const errors = [null, 'maintenance_mode', {}, { error: null }, { error: { code: 1 } }]

  // When
  const results = errors.map((error) => isMaintenanceModeError(503, error))

  // Then
  assert.ok(results.every((result) => result === false))
})

test('Retry-Afterの正の整数秒を解析すること', () => {
  // Given
  const value = ' 120 '

  // When
  const result = parseRetryAfterSeconds(value)

  // Then
  assert.equal(result, 120)
})

test('Retry-Afterが不正または非正値なら既定秒数へフォールバックすること', () => {
  // Given
  const values = [null, '', '0', '-1', '1.5', '60 seconds', '99999999999999999999']

  // When
  const results = values.map((value) => parseRetryAfterSeconds(value))

  // Then
  assert.ok(results.every((result) => result === MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS))
})

test('指定したフォールバック秒数を利用すること', () => {
  // Given
  const value = 'invalid'
  const fallbackSeconds = 30

  // When
  const result = parseRetryAfterSeconds(value, fallbackSeconds)

  // Then
  assert.equal(result, fallbackSeconds)
})
