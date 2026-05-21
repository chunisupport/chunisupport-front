import assert from 'node:assert/strict'
import test from 'node:test'
import { getNextTheme, resolveTheme } from './theme'

test('light から dark へ切り替わること', () => {
  // Given
  const current = 'light' as const

  // When
  const next = getNextTheme(current)

  // Then
  assert.equal(next, 'dark')
})

test('dark から light へ切り替わること', () => {
  // Given
  const current = 'dark' as const

  // When
  const next = getNextTheme(current)

  // Then
  assert.equal(next, 'light')
})

test('テーマ未設定時は light として解決すること', () => {
  // Given
  const datasetTheme = undefined

  // When
  const resolved = resolveTheme(datasetTheme)

  // Then
  assert.equal(resolved, 'light')
})
